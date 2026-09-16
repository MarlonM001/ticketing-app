-- Control de ingreso/salida: cada escaneo alterna el estado del ticket entre
-- "afuera" y "adentro" en vez de invalidar el QR para siempre. Así la puerta
-- puede escanear la salida y volver a habilitar el reingreso.
--
-- scans pasa de ser "un scan único por ticket" a un log de eventos (entrada Y
-- salida quedan registradas). tickets.currently_inside guarda el estado
-- actual para poder decidir la dirección del próximo escaneo sin tener que
-- mirar el último renglón del log.

create type scan_direction as enum ('in', 'out');

alter table scans
  add column direction scan_direction not null default 'in';

alter table scans
  drop constraint scans_ticket_id_key;

alter table tickets
  add column currently_inside boolean not null default false;

-- ---------------------------------------------------------------------------
-- scan_ticket: valida el QR y alterna entrada/salida.
-- Mismo criterio de seguridad que antes (SECURITY DEFINER, solo service_role).
-- El "FOR UPDATE" sigue serializando escaneos simultáneos del mismo ticket
-- para que dos escaneos pegados no alternen el estado de forma inconsistente.
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
  v_direction scan_direction;
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

  v_direction := case when v_ticket.currently_inside then 'out' else 'in' end;

  insert into scans (ticket_id, event_id, scanned_by, direction)
    values (v_ticket.id, v_ticket.event_id, p_scanned_by, v_direction)
    returning * into v_scan;

  update tickets set currently_inside = (v_direction = 'in') where id = v_ticket.id;

  return query select
    (case when v_direction = 'in' then 'ok_in' else 'ok_out' end)::text,
    v_guest_name,
    v_type_name,
    v_scan.scanned_at;
end;
$$;

revoke all on function scan_ticket(text, text) from public;
grant execute on function scan_ticket(text, text) to service_role;

-- ---------------------------------------------------------------------------
-- Vistas: "checked in" pasa a significar "está actualmente adentro" en vez
-- de "tiene al menos un scan", porque ahora un ticket puede tener varios
-- scans (entradas y salidas). rrpp_stats.used_tickets se recalcula con
-- distinct para no duplicar por los reingresos.
-- ---------------------------------------------------------------------------

create or replace view event_stats
with (security_invoker = true) as
select
  e.id as event_id,
  count(t.id) filter (where t.status = 'approved') as total_tickets,
  coalesce(sum(t.price_cents) filter (where t.status = 'approved'), 0) as total_revenue_cents,
  count(t.id) filter (where t.status = 'approved' and t.currently_inside) as checked_in_count
from events e
left join tickets t on t.event_id = e.id
group by e.id;

create or replace view rrpp_stats
with (security_invoker = true) as
select
  r.id as rrpp_id,
  r.name,
  t.event_id,
  count(t.id) as total_tickets,
  count(t.id) filter (where t.status = 'approved') as approved_tickets,
  count(distinct s.ticket_id) as used_tickets,
  coalesce(sum(t.price_cents) filter (where t.status = 'approved'), 0) as revenue_cents,
  count(t.id) filter (where t.price_cents = 0) as courtesy_count
from rrpp r
join tickets t on t.rrpp_id = r.id
left join scans s on s.ticket_id = t.id
group by r.id, r.name, t.event_id;

create or replace view staff_checkin_stats
with (security_invoker = true) as
select
  tt.event_id,
  count(t.id) filter (where t.status = 'approved') as staff_total,
  count(t.id) filter (where t.status = 'approved' and t.currently_inside) as staff_checked_in
from ticket_types tt
join tickets t on t.ticket_type_id = tt.id
where tt.is_staff_type = true
group by tt.event_id;
