import { createClient } from "@/lib/supabase/server";
import AsistenciaClient from "./asistencia-client";

export default async function AsistenciaPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createClient();

  const { data: tickets } = await supabase
    .from("tickets")
    .select("id, currently_inside, ticket_types(name), guests(name, phone)")
    .eq("event_id", eventId)
    .eq("status", "approved")
    .order("currently_inside", { ascending: false });

  const rows = (tickets ?? []).map((t) => {
    const ticketType = t.ticket_types as unknown as { name: string } | null;
    const guest = t.guests as unknown as { name: string; phone: string | null } | null;
    return {
      id: t.id,
      currentlyInside: t.currently_inside,
      ticketTypeName: ticketType?.name ?? "—",
      guestName: guest?.name ?? "—",
      guestPhone: guest?.phone ?? "",
    };
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Asistencia</h1>
      <AsistenciaClient rows={rows} />
    </div>
  );
}
