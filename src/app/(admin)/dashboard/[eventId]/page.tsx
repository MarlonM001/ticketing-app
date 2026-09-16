import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import RealtimeRefresher from "./realtime-refresher";
import TypeBreakdownChart from "./type-breakdown-chart";
import AlertsBanner from "./alerts-banner";
import StatCard from "./stat-card";

export default async function EventDashboardPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createClient();

  const [
    { data: event },
    { data: stats },
    { data: breakdown },
    { data: staffStats },
    { data: alerts },
    { data: productSales },
    { data: attendance },
  ] = await Promise.all([
    supabase.from("events").select("name").eq("id", eventId).single(),
    supabase.from("event_stats").select("*").eq("event_id", eventId).maybeSingle(),
    supabase
      .from("ticket_type_breakdown")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order"),
    supabase.from("staff_checkin_stats").select("*").eq("event_id", eventId).maybeSingle(),
    supabase
      .from("staff_alerts")
      .select("id, label, reason, created_at")
      .eq("event_id", eventId)
      .eq("resolved", false)
      .order("created_at", { ascending: false }),
    supabase
      .from("product_sales_summary")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order"),
    supabase.from("staff_attendance_stats").select("*").eq("event_id", eventId),
  ]);

  const totalTickets = stats?.total_tickets ?? 0;
  const checkedIn = stats?.checked_in_count ?? 0;
  const revenue = stats?.total_revenue_cents ?? 0;
  const staffTotal = staffStats?.staff_total ?? 0;
  const staffCheckedIn = staffStats?.staff_checked_in ?? 0;

  const totalQty = (breakdown ?? []).reduce((acc, b) => acc + b.qty, 0);
  const barRevenue = (productSales ?? []).reduce((acc, p) => acc + p.revenue_cents, 0);

  const ROLE_LABEL: Record<string, string> = {
    puerta: "Puerta",
    caja: "Caja",
    mesero: "Mesero",
    dj: "DJ",
    vendedor: "Vendedor",
  };

  return (
    <div className="max-w-4xl space-y-6">
      <RealtimeRefresher eventId={eventId} />

      <AlertsBanner eventId={eventId} alerts={alerts ?? []} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">{event?.name}</h1>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link
            href={`/dashboard/${eventId}/escaneo`}
            className="rounded-md border border-lime-700/60 bg-lime-950/30 px-3 py-1.5 text-lime-400 transition hover:border-lime-500"
          >
            Escanear QR
          </Link>
          <Link
            href={`/dashboard/${eventId}/venta-manual`}
            className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-neutral-200 transition hover:border-lime-500 hover:text-lime-400"
          >
            Venta manual
          </Link>
          <Link
            href={`/dashboard/${eventId}/invitados`}
            className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-neutral-200 transition hover:border-lime-500 hover:text-lime-400"
          >
            Invitados
          </Link>
          <Link
            href={`/dashboard/${eventId}/productos`}
            className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-neutral-200 transition hover:border-lime-500 hover:text-lime-400"
          >
            Productos
          </Link>
          <Link
            href={`/dashboard/${eventId}/staff-accounts`}
            className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-neutral-200 transition hover:border-lime-500 hover:text-lime-400"
          >
            Cuentas de staff
          </Link>
          <a
            href={`/api/reports/${eventId}`}
            className="rounded-md border border-lime-600 bg-lime-500/10 px-3 py-1.5 font-medium text-lime-400 transition hover:bg-lime-500/20"
          >
            Descargar reporte
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Ventas"
          value={`$${(revenue / 100).toLocaleString("es-AR")}`}
          description="Total recaudado por entradas aprobadas (pagas y confirmadas), sin contar el consumo de barra. Tocá para ver el detalle por tipo."
          href="#distribucion"
        />
        <StatCard
          label="Asistencia"
          value={`${checkedIn} / ${totalTickets}`}
          description="Invitados actualmente adentro del evento (entraron y todavía no escanearon su salida), sobre el total de entradas vendidas. Tocá para ver el detalle."
          href={`/dashboard/${eventId}/asistencia`}
        />
        <StatCard
          label="Staff"
          value={`${staffCheckedIn} / ${staffTotal}`}
          description="Entradas de cortesía para staff (tipo marcado como 'staff') que están actualmente adentro, sobre el total emitidas. No tiene que ver con las cuentas de Caja/Puerta/Mesero/DJ. Tocá para ver el detalle."
          href={`/dashboard/${eventId}/asistencia/staff`}
        />
        <StatCard
          label="Consumo barra"
          value={`$${(barRevenue / 100).toLocaleString("es-AR")}`}
          description="Total recaudado por venta de productos (bebidas, comida, etc.) registrada desde Caja. Tocá para ver el detalle por producto."
          href="#consumo-barra"
        />
      </div>

      <div id="distribucion" className="scroll-mt-4 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
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

      <div id="consumo-barra" className="scroll-mt-4 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="mb-3 text-sm font-medium uppercase text-neutral-400">Consumo de barra</h2>
        {(productSales ?? []).filter((p) => p.qty_sold > 0).length === 0 ? (
          <p className="text-sm text-neutral-500">Todavía no hay ventas de productos.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-700 text-neutral-500">
                <th className="pb-2">Producto</th>
                <th className="pb-2">Cantidad</th>
                <th className="pb-2">Recaudación</th>
              </tr>
            </thead>
            <tbody>
              {(productSales ?? [])
                .filter((p) => p.qty_sold > 0)
                .map((p) => (
                  <tr key={p.product_id} className="border-b border-neutral-800">
                    <td className="py-2">{p.name}</td>
                    <td className="py-2">{p.qty_sold}</td>
                    <td className="py-2">${(p.revenue_cents / 100).toLocaleString("es-AR")}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="mb-3 text-sm font-medium uppercase text-neutral-400">
          Asistencia del equipo
        </h2>
        {(attendance ?? []).length === 0 ? (
          <p className="text-sm text-neutral-500">No hay cuentas de staff creadas.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(attendance ?? []).map((a) => (
              <StatCard
                key={a.role}
                label={ROLE_LABEL[a.role] ?? a.role}
                value={`${a.checked_in} / ${a.total}`}
                description={`Cuentas de ${ROLE_LABEL[a.role] ?? a.role} activas que ya se usaron para ingresar al menos una vez, sobre el total de cuentas activas de ese rol.`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
