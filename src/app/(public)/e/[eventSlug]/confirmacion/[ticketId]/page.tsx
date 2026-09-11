import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateQrDataUrl } from "@/lib/qr";
import { buildWhatsappUrl } from "@/lib/whatsapp";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ eventSlug: string; ticketId: string }>;
}) {
  const { ticketId } = await params;
  const admin = createAdminClient();

  const { data: ticket } = await admin
    .from("tickets")
    .select(
      "id, qr_code, status, price_cents, event_id, ticket_type_id, guest_id, events(name, venue, starts_at, whatsapp_number, whatsapp_message_template), ticket_types(name), guests(name)",
    )
    .eq("id", ticketId)
    .single();

  if (!ticket) notFound();

  const event = ticket.events as unknown as {
    name: string;
    venue: string | null;
    starts_at: string | null;
    whatsapp_number: string | null;
    whatsapp_message_template: string | null;
  };
  const ticketType = ticket.ticket_types as unknown as { name: string };
  const guest = ticket.guests as unknown as { name: string };

  const qrDataUrl = await generateQrDataUrl(ticket.qr_code);

  const whatsappUrl =
    ticket.status === "pending" && event.whatsapp_number && event.whatsapp_message_template
      ? buildWhatsappUrl({
          number: event.whatsapp_number,
          template: event.whatsapp_message_template,
          guestName: guest.name,
          eventName: event.name,
          ticketTypeName: ticketType.name,
        })
      : null;

  return (
    <div className="mx-auto min-h-screen max-w-md bg-neutral-950 px-4 py-8 text-center text-white">
      <h1 className="text-xl font-bold">{event.name}</h1>
      <p className="text-neutral-400">{ticketType.name}</p>

      {ticket.status === "pending" && (
        <div className="mt-4 rounded-lg border border-amber-600 bg-amber-950/40 p-3 text-sm text-amber-300">
          Tu entrada está <strong>pendiente de aprobación</strong>. Coordiná el pago por
          WhatsApp — una vez confirmado, tu QR quedará habilitado para ingresar.
        </div>
      )}

      {ticket.status === "approved" && (
        <div className="mt-4 rounded-lg border border-lime-600 bg-lime-950/40 p-3 text-sm text-lime-300">
          Entrada confirmada. Mostrá este código al ingresar.
        </div>
      )}

      <div className="mx-auto mt-6 w-fit rounded-xl bg-white p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt="Código QR de la entrada" width={240} height={240} />
      </div>

      <p className="mt-3 text-sm text-neutral-500">{guest.name}</p>

      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 block rounded-md bg-lime-500 px-4 py-3 font-medium text-neutral-950"
        >
          Continuar por WhatsApp
        </a>
      )}
    </div>
  );
}
