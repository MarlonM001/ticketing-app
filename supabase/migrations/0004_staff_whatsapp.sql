-- Ticketing app: número de WhatsApp opcional por link de staff, para poder
-- mandarle el link de acceso directo por WhatsApp desde "Links de staff".

alter table staff_access add column whatsapp_number text;
