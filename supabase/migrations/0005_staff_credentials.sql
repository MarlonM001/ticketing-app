-- Ticketing app: reemplazo de los links de acceso por token (staff_access)
-- por cuentas de usuario y contraseña por rol, administrables por el
-- organizador. Varias personas del mismo rol pueden compartir una cuenta
-- (o el organizador puede crear varias cuentas del mismo rol si prefiere
-- separarlas); el nombre de quien está trabajando se pide en el login y
-- viaja en la sesión, no en la cuenta.
--
-- La tabla staff_access queda en la base sin usarse (por si querés
-- recuperar el historial de links viejos); no se borra en esta migración.

create table staff_credentials (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  username text not null,
  password_hash text not null,
  role staff_role not null,
  active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id, username)
);

create index staff_credentials_event_id_idx on staff_credentials(event_id);

alter table staff_credentials enable row level security;

create policy "organizer manages staff credentials of own events" on staff_credentials
  for all using (
    exists (select 1 from events e where e.id = staff_credentials.event_id and e.created_by = auth.uid())
  ) with check (
    exists (select 1 from events e where e.id = staff_credentials.event_id and e.created_by = auth.uid())
  );

-- Reemplaza la vista de asistencia del equipo (antes basada en staff_access)
-- para que cuente cuentas activas y cuentas que ya se usaron al menos una vez.
drop view if exists staff_attendance_stats;

create view staff_attendance_stats
with (security_invoker = true) as
select
  event_id,
  role,
  count(*) filter (where active = true) as total,
  count(*) filter (where active = true and last_login_at is not null) as checked_in
from staff_credentials
group by event_id, role;
