import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import RealtimeRefresher from "./realtime-refresher";
import TypeBreakdownChart from "./type-breakdown-chart";

export default async function EventDashboardPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createClient();

  const [{ data: event }, { data: stats }, { data: breakdown }, { data: staffStats }, { data: pendingCount }] =
    await Promise.all([
      supabase.from("events").select("name").eq("id", eventId).single(),
      supabase.from("event_stats").select("*").eq("event_id", eventId).maybeSingle(),
      supabase
        .from("ticket_type_breakdown")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order"),
      supabase.from("staff_checkin_stats").select("*").eq("event_id", eventId).maybeSingle(),
      supabase.from("pending_tickets").select("ticket_id").eq("event_id", eventId),
    ]);

  const totalTickets = stats?.total_tickets ?? 0;
  const checkedIn = stats?.checked_in_count ?? 0;
  const revenue = stats?.total_revenue_cents ?? 0;
  const staffTotal = staffStats?.staff_total ?? 0;
  const staffCheckedIn = staffStats?.staff_checked_in ?? 0;
  const pendingN = pendingCount?.length ?? 0;

  const totalQty = (breakdown ?? []).reduce((acc, b) => acc + b.qty, 0);

  return (
    <div className="max-w-4xl space-y-6">
      <RealtimeRefresher eventId={eventId} />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{event?.name}</h1>
        <div className="flex gap-3 text-sm">
          <Link href={`/dashboard/${eventId}/pendientes`} className="text-amber-400">
            Pendientes {pendingN > 0 && `(${pendingN})`}
          </Link>
          <Link href={`/dashboard/${eventId}/rrpp`} className="text-lime-400">
            RRPP
          </Link>
          <Link href={`/dashboard/${eventId}/staff-links`} className="text-lime-400">
            Links de staff
          </Link>
          <a href={`/api/reports/${eventId}`} className="text-lime-400">
            Descargar reporte
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Ventas" value={`$${(revenue / 100).toLocaleString("es-AR")}`} />
        <StatCard label="Asistencia" value={`${checkedIn} / ${totalTickets}`} />
        <StatCard label="Staff" value={`${staffCheckedIn} / ${staffTotal}`} />
        <StatCard label="Pendientes" value={String(pendingN)} />
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="mb-3 text-sm font-medium uppercase text-neutral-400">
          Distribución por tipo
        </h2>
        <TypeBreakdownChart data={(breakdown ?? []).map((b) => ({ name: b.name, qty: b.qty }))} />
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-700 text-neutral-500">
              <th className="pb-2">Tipo</th>
              <th className="pb-2">Cantidad</th>
              <th className="pb-2">% del total</th>
              <th className="pb-2">Recaudación</th>
            </tr>
          </thead>
          <tbody>
            {breakdown?.map((b) => (
              <tr key={b.ticket_type_id} className="border-b border-neutral-800">
                <td className="py-2">{b.name}</td>
                <td className="py-2">{b.qty}</td>
                <td className="py-2">
                  {totalQty > 0 ? `${((b.qty / totalQty) * 100).toFixed(1)}%` : "0%"}
                </td>
                <td className="py-2">${(b.revenue_cents / 100).toLocaleString("es-AR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <p className="text-xs uppercase text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
