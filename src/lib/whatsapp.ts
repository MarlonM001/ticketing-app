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
