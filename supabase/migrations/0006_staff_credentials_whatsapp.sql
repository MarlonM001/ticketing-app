-- Ticketing app: número de WhatsApp opcional por cuenta de staff, para no
-- tener que volver a tipearlo cada vez que se manda el usuario/contraseña
-- o se resetea la contraseña.

alter table staff_credentials add column whatsapp_number text;
