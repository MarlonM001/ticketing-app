export function buildWhatsappUrl(params: {
  number: string;
  template: string;
  guestName: string;
  eventName: string;
  ticketTypeName: string;
}) {
  const message = params.template
    .replaceAll("{{nombre}}", params.guestName)
    .replaceAll("{{evento}}", params.eventName)
    .replaceAll("{{tipo}}", params.ticketTypeName);
  const digits = params.number.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

const STAFF_ROLE_LABEL: Record<string, string> = {
  puerta: "Puerta",
  caja: "Caja",
  mesero: "Mesero",
  dj: "DJ",
};

// Le manda al staff las credenciales de su cuenta compartida por rol y el
// link donde puede loguearse. Igual que buildDirectWhatsappUrl, solo abre
// el chat con el texto precargado — no hay envío automático.
export function buildStaffCredentialsWhatsappUrl(params: {
  number: string;
  role: string;
  username: string;
  password: string;
  loginUrl: string;
}) {
  const roleLabel = STAFF_ROLE_LABEL[params.role] ?? params.role;
  const message =
    `Hola! Estos son tus datos de acceso como ${roleLabel} para el evento:\n` +
    `Usuario: ${params.username}\n` +
    `Contraseña: ${params.password}\n` +
    `Ingresá en: ${params.loginUrl}`;
  const digits = params.number.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

// A diferencia de buildWhatsappUrl (que arma el link del invitado hacia el
// organizador para coordinar el pago), esto abre el chat del organizador
// hacia el cliente para mandarle el QR ya generado. wa.me solo permite
// precargar texto, no adjuntar imágenes: el QR se adjunta a mano en el chat
// que se abre (por eso el mensaje le pide a la persona que espere la foto).
export function buildDirectWhatsappUrl(params: {
  number: string;
  guestName: string;
  eventName: string;
  ticketTypeName: string;
}) {
  const message =
    `Hola ${params.guestName}! Te paso tu entrada para ${params.eventName} ` +
    `(${params.ticketTypeName}). Te adjunto el código QR en este chat, ` +
    `guardalo y mostralo al ingresar.`;
  const digits = params.number.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
