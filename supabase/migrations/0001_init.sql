-- Ticketing app: schema inicial
-- Correr esto en el SQL Editor de Supabase (o via `supabase db push` con la CLI).

create extension if not exists pgcrypto;

create type ticket_status as enum ('pending', 'approved', 'rejected');
create type event_status as enum ('draft', 'published', 'closed');

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  venue text,
  starts_at timestamptz,
  whatsapp_number text,
  whatsapp_message_template text,
  status event_status not null default 'draft',
  created_by uuid not null references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now()
);

create table ticket_types (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  price_cents integer not null default 0,
  is_staff_type boolean not null default false,
  quantity_available integer,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table rrpp (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) default auth.uid(),
  name text not null,
  code text unique not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table guests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  id_number text,
  created_at timestamptz not null default now()
);

create table tickets (
  id uuid primary key default gen_random_uuid(),
  qr_code text unique not null,
  event_id uuid not null references events(id) on delete cascade,
  ticket_type_id uuid not null references ticket_types(id),
  guest_id uuid not null references guests(id),
  rrpp_id uuid references rrpp(id),
  price_cents integer not null,
  status ticket_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index tickets_event_id_idx on tickets(event_id);
create index tickets_rrpp_id_idx on tickets(rrpp_id);
create index tickets_status_idx on tickets(status);
create index tickets_ticket_type_id_idx on tickets(ticket_type_id);

create table scans (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid unique not null references tickets(id) on delete cascade,
  -- Denormalizado a propósito: permite filtrar el canal de Realtime del
  -- dashboard (`event_id=eq.<id>`) sin un join, cosa que Realtime no soporta.
  event_id uuid not null references events(id) on delete cascade,
  scanned_at timestamptz not null default now(),
  scanned_by text
);

create index scans_event_id_idx on scans(event_id);

create table staff_access (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  label text not null,
  token text unique not null,
  pin_hash text,
  revoked boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Vistas de reporting (security_invoker: respetan RLS del usuario que consulta,
-- necesario porque el dashboard las lee directo desde el browser con el JWT
-- del organizador para poder usar Realtime).
-- ---------------------------------------------------------------------------

create view event_stats
with (security_invoker = true) as
select
  e.id as event_id,
  count(t.id) filter (where t.status = 'approved') as total_tickets,
  coalesce(sum(t.price_cents) filter (where t.status = 'approved'), 0) as total_revenue_cents,
  count(s.id) as checked_in_count
from events e
left join tickets t on t.event_id = e.id
left join scans s on s.ticket_id = t.id
group by e.id;

create view ticket_type_breakdown
with (security_invoker = true) as
select
  tt.event_id,
  tt.id as ticket_type_id,
  tt.name,
  tt.sort_order,
  count(t.id) filter (where t.status = 'approved') as qty,
  coalesce(sum(t.price_cents) filter (where t.status = 'approved'), 0) as revenue_cents
from ticket_types tt
left join tickets t on t.ticket_type_id = tt.id
group by tt.event_id, tt.id, tt.name, tt.sort_order;

create view rrpp_stats
with (security_invoker = true) as
select
  r.id as rrpp_id,
  r.name,
  t.event_id,
  count(t.id) as total_tickets,
  count(t.id) filter (where t.status = 'approved') as approved_tickets,
  count(s.id) as used_tickets,
  coalesce(sum(t.price_cents) filter (where t.status = 'approved'), 0) as revenue_cents,
  count(t.id) filter (where t.price_cents = 0) as courtesy_count
from rrpp r
join tickets t on t.rrpp_id = r.id
left join scans s on s.ticket_id = t.id
group by r.id, r.name, t.event_id;

create view staff_checkin_stats
with (security_invoker = true) as
select
  tt.event_id,
  count(t.id) filter (where t.status = 'approved') as staff_total,
  count(s.id) as staff_checked_in
from ticket_types tt
join tickets t on t.ticket_type_id = tt.id
left join scans s on s.ticket_id = t.id
where tt.is_staff_type = true
group by tt.event_id;

create view pending_tickets
with (security_invoker = true) as
select
  t.id as ticket_id,
  t.event_id,
  t.qr_code,
  t.price_cents,
  t.created_at,
  tt.name as ticket_type_name,
  g.name as guest_name,
  g.phone as guest_phone
from tickets t
join ticket_types tt on tt.id = t.ticket_type_id
join guests g on g.id = t.guest_id
where t.status = 'pending';

-- ---------------------------------------------------------------------------
-- scan_ticket: valida y registra el ingreso de un ticket por su QR.
-- SECURITY DEFINER + acceso restringido a service_role: solo puede invocarse
-- desde un server action que ya haya validado la cookie de staff_access.
-- El "FOR UPDATE" serializa escaneos simultáneos del mismo QR; el UNIQUE en
-- scans.ticket_id es el backstop si igual llegaran a pisarse.
-- ---------------------------------------------------------------------------

create or replace function scan_ticket(p_qr_code text, p_scanned_by text)
returns table (
  result text,
  guest_name text,
  ticket_type_name text,
  scanned_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket tickets%rowtype;
  v_scan scans%rowtype;
  v_guest_name text;
  v_type_name text;
begin
  select * into v_ticket from tickets where qr_code = p_qr_code for update;

  if not found then
    return query select 'invalid'::text, null::text, null::text, null::timestamptz;
    return;
  end if;

  select name into v_guest_name from guests where id = v_ticket.guest_id;
  select name into v_type_name from ticket_types where id = v_ticket.ticket_type_id;

  if v_ticket.status = 'pending' then
    return query select 'pending'::text, v_guest_name, v_type_name, null::timestamptz;
    return;
  end if;

  if v_ticket.status = 'rejected' then
    return query select 'invalid'::text, null::text, null::text, null::timestamptz;
    return;
  end if;

  select * into v_scan from scans where ticket_id = v_ticket.id;

  if found then
    return query select 'already_used'::text, v_guest_name, v_type_name, v_scan.scanned_at;
    return;
  end if;

  begin
    insert into scans (ticket_id, event_id, scanned_by)
      values (v_ticket.id, v_ticket.event_id, p_scanned_by)
      returning * into v_scan;
  exception when unique_violation then
    select * into v_scan from scans where ticket_id = v_ticket.id;
    return query select 'already_used'::text, v_guest_name, v_type_name, v_scan.scanned_at;
    return;
  end;

  return query select 'ok'::text, v_guest_name, v_type_name, v_scan.scanned_at;
end;
$$;

revoke all on function scan_ticket(text, text) from public;
grant execute on function scan_ticket(text, text) to service_role;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table events enable row level security;
alter table ticket_types enable row level security;
alter table rrpp enable row level security;
alter table guests enable row level security;
alter table tickets enable row level security;
alter table scans enable row level security;
alter table staff_access enable row level security;

create policy "organizer manages own events" on events
  for all using (created_by = auth.uid()) with check (created_by = auth.uid());

create policy "public reads published events" on events
  for select using (status = 'published');

create policy "public reads ticket types of published events" on ticket_types
  for select using (
    exists (select 1 from events e where e.id = ticket_types.event_id and e.status = 'published')
  );

create policy "organizer manages own ticket types" on ticket_types
  for all using (
    exists (select 1 from events e where e.id = ticket_types.event_id and e.created_by = auth.uid())
  ) with check (
    exists (select 1 from events e where e.id = ticket_types.event_id and e.created_by = auth.uid())
  );

create policy "organizer manages own rrpp" on rrpp
  for all using (created_by = auth.uid()) with check (created_by = auth.uid());

create policy "organizer reads guests of own events" on guests
  for select using (
    exists (
      select 1 from tickets t join events e on e.id = t.event_id
      where t.guest_id = guests.id and e.created_by = auth.uid()
    )
  );

create policy "organizer manages tickets of own events" on tickets
  for all using (
    exists (select 1 from events e where e.id = tickets.event_id and e.created_by = auth.uid())
  ) with check (
    exists (select 1 from events e where e.id = tickets.event_id and e.created_by = auth.uid())
  );

create policy "organizer reads scans of own events" on scans
  for select using (
    exists (select 1 from events e where e.id = scans.event_id and e.created_by = auth.uid())
  );

create policy "organizer manages staff access of own events" on staff_access
  for all using (
    exists (select 1 from events e where e.id = staff_access.event_id and e.created_by = auth.uid())
  ) with check (
    exists (select 1 from events e where e.id = staff_access.event_id and e.created_by = auth.uid())
  );

-- Nota: no hace falta policy de INSERT para anon en guests/tickets. El
-- checkout público escribe a través de un server action que usa la
-- service role key (bypassa RLS), nunca con la anon key del cliente.

-- ---------------------------------------------------------------------------
-- Realtime: habilitar broadcast de cambios en scans/tickets para el dashboard
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table scans;
alter publication supabase_realtime add table tickets;
