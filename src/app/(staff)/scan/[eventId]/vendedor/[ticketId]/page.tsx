import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyStaffSession, STAFF_COOKIE_NAME } from "@/lib/staff-session";
import { generateQrDataUrl } from "@/lib/qr";
import { buildDirectWhatsappUrl } from "@/lib/whatsapp";
import SendWhatsappButton from "@/components/send-whatsapp-button";

export default async function VendedorConfirmationPage({
  params,
}: {
  params: Promise<{ eventId: string; ticketId: string }>;
}) {
  const { eventId, ticketId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(STAFF_COOKIE_NAME)?.value;
  const session = token ? await verifyStaffSession(token) : null;

  if (!session || session.eventId !== eventId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 text-center text-neutral-400">
        Sesión de staff inválida, volvé a ingresar por el link de acceso.
      </div>
    );
  }

  const admin = createAdminClient();
  const { data: ticket } = await admin
    .from("tickets")
    .select("id, qr_code, price_cents, events(name), ticket_types(name), guests(name, phone)")
    .eq("id", ticketId)
    .eq("event_id", eventId)
    .single();

  if (!ticket) notFound();

  const event = ticket.events as unknown as { name: string };
  const ticketType = ticket.ticket_types as unknown as { name: string };
  const guest = ticket.guests as unknown as { name: string; phone: string | null };

  const qrDataUrl = await generateQrDataUrl(ticket.qr_code);

  const whatsappUrl = guest.phone
    ? buildDirectWhatsappUrl({
        number: guest.phone,
        guestName: guest.name,
        eventName: event.name,
        ticketTypeName: ticketType.name,
      })
    : null;

  return (
    <div className="mx-auto min-h-screen max-w-md space-y-4 bg-neutral-950 p-4 text-center text-white">
      <h1 className="text-xl font-semibold">Entrada registrada</h1>
      <p className="text-neutral-400">
        {guest.name} · {ticketType.name} · ${(ticket.price_cents / 100).toLocaleString("es-AR")}
      </p>

      <div className="mx-auto w-fit rounded-xl bg-white p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt="Código QR de la entrada" width={240} height={240} />
      </div>

      <a
        href={qrDataUrl}
        download={`qr-${guest.name.replace(/[^a-z0-9]+/gi, "-")}.png`}
        className="block rounded-md border border-neutral-700 px-4 py-2 text-sm"
      >
        Descargar QR
      </a>

      {whatsappUrl && (
        <SendWhatsappButton
          qrDataUrl={qrDataUrl}
          fileName={`qr-${guest.name.replace(/[^a-z0-9]+/gi, "-")}.png`}
          whatsappUrl={whatsappUrl}
        />
      )}
      <p className="text-xs text-neutral-500">
        Esto descarga el QR y abre WhatsApp a la vez: WhatsApp no deja adjuntar la
        imagen sola desde un link, así que la tenés que arrastrar al chat que se abre.
      </p>

      <Link
        href={`/scan/${eventId}/vendedor`}
        className="block text-sm text-neutral-500 underline"
      >
        Registrar otra persona
      </Link>
    </div>
  );
}
