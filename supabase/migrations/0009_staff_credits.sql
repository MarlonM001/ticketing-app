-- Ticketing app: el organizador puede regalarle crédito (con un mensaje)
-- a todo el staff activo de un evento, para que tomen algo a su cuenta.
-- Al gastarlo con "Pedir algo" se descuenta el crédito primero (no el
-- sueldo) y la venta queda marcada como cortesía: sale del stock igual,
-- pero no cuenta como recaudación real de barra.

alter table staff_credentials add column credit_cents integer not null default 0;
alter table staff_credentials add column credit_message text;

alter table product_sales add column is_courtesy boolean not null default false;

-- record_sale: mismo comportamiento de antes, con un parámetro nuevo para
-- marcar la venta como cortesía.
drop function if exists record_sale(uuid, uuid, integer, text, uuid);

create or replace function record_sale(
  p_event_id uuid,
  p_product_id uuid,
  p_quantity integer,
  p_sold_by text,
  p_charged_to_staff_id uuid default null,
  p_is_courtesy boolean default false
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

  insert into product_sales (event_id, product_id, quantity, unit_price_cents, sold_by, charged_to_staff_id, is_courtesy)
    values (p_event_id, v_product.id, p_quantity, v_product.price_cents, p_sold_by, p_charged_to_staff_id, p_is_courtesy)
    returning * into v_sale;

  return query select 'ok'::text, v_product.name, v_product.stock_quantity;
end;
$$;

revoke all on function record_sale(uuid, uuid, integer, text, uuid, boolean) from public;
grant execute on function record_sale(uuid, uuid, integer, text, uuid, boolean) to service_role;

-- grant_staff_credit: reparte el mismo crédito y mensaje a todo el staff
-- activo del evento. No es security definer: corre con los permisos del
-- organizador que la llama, así que la RLS de staff_credentials (solo
-- eventos propios) protege esto sola.
create or replace function grant_staff_credit(p_event_id uuid, p_message text, p_amount_cents integer)
returns integer
language plpgsql
as $$
declare
  v_count integer;
begin
  update staff_credentials
    set credit_cents = credit_cents + p_amount_cents,
        credit_message = p_message
    where event_id = p_event_id and active = true;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on function grant_staff_credit(uuid, text, integer) to authenticated;

-- product_sales_summary: la cortesía sigue saliendo del stock, pero no
-- cuenta como recaudación real de barra.
drop view if exists product_sales_summary;

create view product_sales_summary
with (security_invoker = true) as
select
  p.event_id,
  p.id as product_id,
  p.name,
  p.sort_order,
  coalesce(sum(ps.quantity), 0) as qty_sold,
  coalesce(sum(ps.quantity * ps.unit_price_cents) filter (where ps.is_courtesy = false), 0) as revenue_cents
from products p
left join product_sales ps on ps.product_id = p.id
group by p.event_id, p.id, p.name, p.sort_order;

-- staff_settlement: suma credit_cents/credit_message para mostrarlos en
-- "Cuentas de staff".
drop view if exists staff_settlement;

create view staff_settlement
with (security_invoker = true) as
select
  sc.id,
  sc.event_id,
  sc.username,
  sc.role,
  sc.active,
  sc.last_login_at,
  sc.whatsapp_number,
  sc.pay_cents,
  sc.credit_cents,
  sc.credit_message,
  coalesce(sum(ps.quantity * ps.unit_price_cents), 0) as consumed_cents,
  sc.pay_cents - coalesce(sum(ps.quantity * ps.unit_price_cents), 0) as net_pay_cents
from staff_credentials sc
left join product_sales ps on ps.charged_to_staff_id = sc.id
group by sc.id, sc.event_id, sc.username, sc.role, sc.active, sc.last_login_at, sc.whatsapp_number, sc.pay_cents, sc.credit_cents, sc.credit_message;
