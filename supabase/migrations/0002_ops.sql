-- Ticketing app: operación del evento (staff por rol, alertas de puerta,
-- productos e inventario de barra).
-- Correr esto en el SQL Editor de Supabase (o via `supabase db push`).

-- ---------------------------------------------------------------------------
-- Staff: roles y asistencia
-- ---------------------------------------------------------------------------

create type staff_role as enum ('puerta', 'caja', 'mesero', 'dj');

alter table staff_access
  add column role staff_role not null default 'puerta',
  add column checked_in_at timestamptz;

-- El organizador puede editar nombre/teléfono de invitados desde la pantalla
-- de "Invitados" (0001 solo tenía policy de lectura para esta tabla).
create policy "organizer updates guests of own events" on guests
  for update using (
    exists (
      select 1 from tickets t join events e on e.id = t.event_id
      where t.guest_id = guests.id and e.created_by = auth.uid()
    )
  ) with check (
    exists (
      select 1 from tickets t join events e on e.id = t.event_id
      where t.guest_id = guests.id and e.created_by = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Alertas de puerta
-- ---------------------------------------------------------------------------

create table staff_alerts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  label text not null,
  reason text,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create index staff_alerts_event_id_idx on staff_alerts(event_id);

alter table staff_alerts enable row level security;

create policy "organizer manages alerts of own events" on staff_alerts
  for all using (
    exists (select 1 from events e where e.id = staff_alerts.event_id and e.created_by = auth.uid())
  ) with check (
    exists (select 1 from events e where e.id = staff_alerts.event_id and e.created_by = auth.uid())
  );

alter publication supabase_realtime add table staff_alerts;

-- ---------------------------------------------------------------------------
-- Productos e inventario de barra
-- ---------------------------------------------------------------------------

create table products (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  price_cents integer not null default 0,
  stock_quantity integer,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index products_event_id_idx on products(event_id);

create table product_sales (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity integer not null default 1,
  unit_price_cents integer not null,
  sold_by text not null,
  created_at timestamptz not null default now()
);

create index product_sales_event_id_idx on product_sales(event_id);
create index product_sales_product_id_idx on product_sales(product_id);

alter table products enable row level security;
alter table product_sales enable row level security;

create policy "organizer manages own products" on products
  for all using (
    exists (select 1 from events e where e.id = products.event_id and e.created_by = auth.uid())
  ) with check (
    exists (select 1 from events e where e.id = products.event_id and e.created_by = auth.uid())
  );

create policy "organizer reads product sales of own events" on product_sales
  for select using (
    exists (select 1 from events e where e.id = product_sales.event_id and e.created_by = auth.uid())
  );

alter publication supabase_realtime add table product_sales;

-- ---------------------------------------------------------------------------
-- record_sale: valida stock y registra una venta de barra.
-- Mismo criterio que scan_ticket: SECURITY DEFINER, solo invocable por
-- service_role desde un server action que ya validó la sesión de staff
-- (role = 'caja'). El "FOR UPDATE" serializa ventas concurrentes del mismo
-- producto para no pisar el descuento de stock.
-- ---------------------------------------------------------------------------

create or replace function record_sale(
  p_event_id uuid,
  p_product_id uuid,
  p_quantity integer,
  p_sold_by text
)
returns table (
  result text,
  product_name text,
  remaining_stock integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product products%rowtype;
  v_sale product_sales%rowtype;
begin
  if p_quantity is null or p_quantity < 1 then
    return query select 'invalid_quantity'::text, null::text, null::integer;
    return;
  end if;

  select * into v_product
    from products
    where id = p_product_id and event_id = p_event_id
    for update;

  if not found or not v_product.active then
    return query select 'invalid_product'::text, null::text, null::integer;
    return;
  end if;

  if v_product.stock_quantity is not null and v_product.stock_quantity < p_quantity then
    return query select 'out_of_stock'::text, v_product.name, v_product.stock_quantity;
    return;
  end if;

  if v_product.stock_quantity is not null then
    update products
      set stock_quantity = stock_quantity - p_quantity
      where id = v_product.id
      returning stock_quantity into v_product.stock_quantity;
  end if;

  insert into product_sales (event_id, product_id, quantity, unit_price_cents, sold_by)
    values (p_event_id, v_product.id, p_quantity, v_product.price_cents, p_sold_by)
    returning * into v_sale;

  return query select 'ok'::text, v_product.name, v_product.stock_quantity;
end;
$$;

revoke all on function record_sale(uuid, uuid, integer, text) from public;
grant execute on function record_sale(uuid, uuid, integer, text) to service_role;

-- ---------------------------------------------------------------------------
-- Vistas de reporting (security_invoker: respetan RLS del organizador)
-- ---------------------------------------------------------------------------

create view product_sales_summary
with (security_invoker = true) as
select
  p.event_id,
  p.id as product_id,
  p.name,
  p.sort_order,
  coalesce(sum(ps.quantity), 0) as qty_sold,
  coalesce(sum(ps.quantity * ps.unit_price_cents), 0) as revenue_cents
from products p
left join product_sales ps on ps.product_id = p.id
group by p.event_id, p.id, p.name, p.sort_order;

create view staff_attendance_stats
with (security_invoker = true) as
select
  event_id,
  role,
  count(*) filter (where revoked = false) as total,
  count(*) filter (where revoked = false and checked_in_at is not null) as checked_in
from staff_access
group by event_id, role;
