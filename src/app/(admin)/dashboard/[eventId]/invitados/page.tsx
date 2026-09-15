import { createClient } from "@/lib/supabase/server";
import InvitadosClient from "./invitados-client";

export default async function InvitadosPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createClient();

  const [{ data: tickets }, { data: ticketTypes }] = await Promise.all([
    supabase
      .from("tickets")
      .select(
        "id, status, price_cents, created_at, ticket_type_id, ticket_types(name), guests(id, name, phone)",
      )
      .eq("event_id", eventId)
      .order("created_at", { ascending: false }),
    supabase
      .from("ticket_types")
      .select("id, name")
      .eq("event_id", eventId)
      .eq("active", true)
      .order("sort_order"),
  ]);

  const rows = (tickets ?? []).map((t) => {
    const ticketType = t.ticket_types as unknown as { name: string } | null;
    const guest = t.guests as unknown as { id: string; name: string; phone: string | null } | null;
    return {
      id: t.id,
      status: t.status,
      priceCents: t.price_cents,
      createdAtLabel: new Date(t.created_at).toLocaleString("es-AR", {
        dateStyle: "short",
        timeStyle: "short",
      }),
      ticketTypeId: t.ticket_type_id,
      ticketTypeName: ticketType?.name ?? "—",
      guestName: guest?.name ?? "—",
      guestPhone: guest?.phone ?? "",
    };
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Invitados</h1>
      <InvitadosClient eventId={eventId} rows={rows} ticketTypes={ticketTypes ?? []} />
    </div>
  );
}
