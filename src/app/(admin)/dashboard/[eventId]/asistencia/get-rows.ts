import { createClient } from "@/lib/supabase/server";

export type AsistenciaRow = {
  id: string;
  currentlyInside: boolean;
  ticketTypeName: string;
  guestName: string;
  guestPhone: string;
};

export async function getAsistenciaRows(
  eventId: string,
  onlyStaff: boolean,
): Promise<AsistenciaRow[]> {
  const supabase = await createClient();

  const { data: tickets } = await supabase
    .from("tickets")
    .select("id, currently_inside, ticket_types(name, is_staff_type), guests(name, phone)")
    .eq("event_id", eventId)
    .eq("status", "approved")
    .order("currently_inside", { ascending: false });

  return (tickets ?? [])
    .filter((t) => {
      if (!onlyStaff) return true;
      const ticketType = t.ticket_types as unknown as { is_staff_type: boolean } | null;
      return !!ticketType?.is_staff_type;
    })
    .map((t) => {
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
}
