import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateQrDataUrl } from "@/lib/qr";
import { buildDirectWhatsappUrl } from "@/lib/whatsapp";
import SendWhatsappButton from "./send-whatsapp-button";

export default async function VentaManualConfirmationPage({
  params,
}: {
  params: Promise<{ eventId: string; ticketId: string }>;
}) {
  const { eventId, ticketId } = await params;
  const supabase = await createClient();

  const { data: ticket } = await supabase
    .from("tickets")
    .select(
      "id, qr_code, price_cents, payment_proof_path, events(name), ticket_types(name), guests(name, phone)",
    )
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

  let proofUrl: string | null = null;
  if (ticket.payment_proof_path) {
    const admin = createAdminClient();
    const { data: signed } = await admin.storage
      .from("payment-proofs")
      .createSignedUrl(ticket.payment_proof_path, 60 * 10);
    proofUrl = signed?.signedUrl ?? null;
  }

  return (
    <div className="mx-auto max-w-md space-y-4 text-center">
      <h1 className="text-xl font-semibold">Venta registrada</h1>
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

      {proofUrl && (
        <a
          href={proofUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-md border border-neutral-700 px-4 py-2 text-sm"
        >
          Ver comprobante
        </a>
      )}

      <Link
        href={`/dashboard/${eventId}/venta-manual`}
        className="block text-sm text-neutral-500 underline"
      >
        Cargar otra venta
      </Link>
    </div>
  );
}
