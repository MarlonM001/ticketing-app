import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AsistenciaClient from "./asistencia-client";

export default async function AsistenciaPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { eventId } = await params;
  const { tipo } = await searchParams;
  const onlyStaff = tipo === "staff";
  const supabase = await createClient();

  const { data: tickets } = await supabase
    .from("tickets")
    .select("id, currently_inside, ticket_types(name, is_staff_type), guests(name, phone)")
    .eq("event_id", eventId)
    .eq("status", "approved")
    .order("currently_inside", { ascending: false });

  const rows = (tickets ?? [])
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

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{onlyStaff ? "Asistencia · Staff" : "Asistencia"}</h1>
        {onlyStaff && (
          <Link href={`/dashboard/${eventId}/asistencia`} className="text-sm text-lime-400">
            Ver todos
          </Link>
        )}
      </div>
      <AsistenciaClient rows={rows} />
    </div>
  );
}
