-- Fix: "column reference scanned_at is ambiguous" al escanear.
-- scan_ticket declara scanned_at como columna de salida (returns table),
-- lo que la vuelve también una variable dentro de la función; el
-- "select scanned_at ... from scans" de la 0011 quedaba ambiguo entre esa
-- variable y la columna scans.scanned_at. Se soluciona calificando la
-- columna con el alias de la tabla.

create or replace function scan_ticket(
  p_qr_code text,
  p_scanned_by text,
  p_force boolean default false
)
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
  v_last_out timestamptz;
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

  if v_direction = 'in' and not p_force then
    select s.scanned_at into v_last_out
      from scans s
      where s.ticket_id = v_ticket.id and s.direction = 'out'
      order by s.scanned_at desc
      limit 1;

    if v_last_out is not null and now() - v_last_out > interval '5 hours' then
      return query select 'reentry_expired'::text, v_guest_name, v_type_name, v_last_out;
      return;
    end if;
  end if;

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

revoke all on function scan_ticket(text, text, boolean) from public;
grant execute on function scan_ticket(text, text, boolean) to service_role;
