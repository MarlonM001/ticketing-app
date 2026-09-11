import { createClient } from "@/lib/supabase/server";
import PendingRow from "./pending-row";

export default async function PendientesPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createClient();

  const { data: pending } = await supabase
    .from("pending_tickets")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Pendientes de aprobación</h1>
      {!pending || pending.length === 0 ? (
        <p className="text-neutral-400">No hay tickets pendientes.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-700 text-neutral-500">
              <th className="pb-2">Nombre</th>
              <th className="pb-2">Teléfono</th>
              <th className="pb-2">Tipo</th>
              <th className="pb-2">Precio</th>
              <th className="pb-2">Solicitado</th>
              <th className="pb-2">Acción</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((t) => (
              <PendingRow
                key={t.ticket_id}
                ticket={{
                  ...t,
                  createdAtLabel: new Date(t.created_at).toLocaleString("es-AR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }),
                }}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
