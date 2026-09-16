-- Nuevo rol de staff "vendedor": reemplaza a RRPP. Es una cuenta de staff
-- más (login por usuario/contraseña como puerta/caja/mesero/dj) que, una
-- vez adentro, registra personas y les genera el QR para mandar por
-- WhatsApp — sin pasar por el organizador.
--
-- ALTER TYPE ... ADD VALUE no puede usarse en la misma transacción en la
-- que después se referencia el valor nuevo, así que esta migración va sola.
alter type staff_role add value 'vendedor';
