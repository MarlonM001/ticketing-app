import { createClient } from "@/lib/supabase/server";
import VentaManualClient from "./venta-manual-client";

export default async function VentaManualPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createClient();

  const { data: ticketTypes } = await supabase
    .from("ticket_types")
    .select("id, name, price_cents")
    .eq("event_id", eventId)
    .eq("active", true)
    .order("sort_order");

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Registrar venta manual</h1>
      <p className="mb-4 max-w-xl text-sm text-neutral-400">
        Usá esto cuando ya cobraste una entrada por fuera de la app (efectivo o
        transferencia). Cargá los datos del cliente y, si querés, una foto de
        respaldo (factura o foto del efectivo recibido).
      </p>
      <VentaManualClient eventId={eventId} ticketTypes={ticketTypes ?? []} />
    </div>
  );
}
