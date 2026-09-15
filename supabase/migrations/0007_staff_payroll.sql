-- Ticketing app: sueldo acordado por cuenta de staff para el evento, y
-- consumo de barra cargado a una cuenta de staff en vez de cobrado en
-- efectivo (se descuenta del sueldo al liquidar).

alter table staff_credentials add column pay_cents integer not null default 0;

alter table product_sales
  add column charged_to_staff_id uuid references staff_credentials(id) on delete set null;

create index product_sales_charged_to_staff_id_idx on product_sales(charged_to_staff_id);

-- record_sale: mismo comportamiento de antes, con un parámetro nuevo
-- opcional para cargar la venta a una cuenta de staff en vez de cobrarla.
drop function if exists record_sale(uuid, uuid, integer, text);

create or replace function record_sale(
  p_event_id uuid,
  p_product_id uuid,
  p_quantity integer,
  p_sold_by text,
  p_charged_to_staff_id uuid default null
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

  insert into product_sales (event_id, product_id, quantity, unit_price_cents, sold_by, charged_to_staff_id)
    values (p_event_id, v_product.id, p_quantity, v_product.price_cents, p_sold_by, p_charged_to_staff_id)
    returning * into v_sale;

  return query select 'ok'::text, v_product.name, v_product.stock_quantity;
end;
$$;

revoke all on function record_sale(uuid, uuid, integer, text, uuid) from public;
grant execute on function record_sale(uuid, uuid, integer, text, uuid) to service_role;

-- staff_settlement: sueldo acordado menos lo que consumió cada cuenta, para
-- saber cuánto pagarle al liquidar. Reemplaza a staff_credentials como
-- fuente de la pantalla "Cuentas de staff".
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
  coalesce(sum(ps.quantity * ps.unit_price_cents), 0) as consumed_cents,
  sc.pay_cents - coalesce(sum(ps.quantity * ps.unit_price_cents), 0) as net_pay_cents
from staff_credentials sc
left join product_sales ps on ps.charged_to_staff_id = sc.id
group by sc.id, sc.event_id, sc.username, sc.role, sc.active, sc.last_login_at, sc.whatsapp_number, sc.pay_cents;
