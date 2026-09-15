-- Ticketing app: permite que un rol de staff (por ahora DJ) le mande un
-- aviso puntual a otro rol (Caja), reusando la tabla de alertas existente.
-- target_role null = alerta general para el organizador (comportamiento
-- actual del botón "Alertar" de Puerta); target_role con valor = aviso
-- dirigido a la pantalla de ese rol.

alter table staff_alerts add column target_role staff_role;
