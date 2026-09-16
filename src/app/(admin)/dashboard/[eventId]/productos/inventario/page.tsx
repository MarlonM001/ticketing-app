import Link from "next/link";
import { getInventoryRows, sumInventoryTotals } from "@/lib/inventory";

export default async function InventarioPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const rows = await getInventoryRows(eventId);
  const totals = sumInventoryTotals(rows);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Inventario de barra</h1>
        <Link href={`/dashboard/${eventId}/productos`} className="text-sm text-lime-400">
          ← Volver a Productos
        </Link>
      </div>
      <p className="mb-4 max-w-xl text-sm text-neutral-400">
        Comparativo de stock inicial contra lo que quedó, para llevar la trazabilidad del
        evento.
      </p>

      {rows.length === 0 ? (
        <p className="text-neutral-400">Todavía no hay productos cargados para este evento.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-700 text-neutral-500">
                <th className="pb-2 pr-4">Producto</th>
                <th className="pb-2 pr-4">Stock inicial</th>
                <th className="pb-2 pr-4">Stock final</th>
                <th className="pb-2 pr-4">Vendido</th>
                <th className="pb-2 pr-4">Cortesías</th>
                <th className="pb-2">Recaudación</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-neutral-800">
                  <td className="py-2 pr-4">
                    {r.name}
                    {!r.active && <span className="ml-2 text-xs text-red-400">(inactivo)</span>}
                  </td>
                  <td className="py-2 pr-4">{r.initialStock ?? "sin límite"}</td>
                  <td className="py-2 pr-4">{r.finalStock ?? "sin límite"}</td>
                  <td className="py-2 pr-4">{r.qtySold}</td>
                  <td className="py-2 pr-4">{r.courtesyQty > 0 ? r.courtesyQty : "—"}</td>
                  <td className="py-2">${(r.revenueCents / 100).toLocaleString("es-AR")}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="text-neutral-400">
                <td className="pt-2 pr-4 font-medium text-white">Total</td>
                <td className="pt-2 pr-4">—</td>
                <td className="pt-2 pr-4">—</td>
                <td className="pt-2 pr-4">{totals.qtySold}</td>
                <td className="pt-2 pr-4">{totals.courtesyQty > 0 ? totals.courtesyQty : "—"}</td>
                <td className="pt-2 font-medium text-white">
                  ${(totals.revenueCents / 100).toLocaleString("es-AR")}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <a
        href={`/api/reports/${eventId}/inventario`}
        className="mt-4 inline-block rounded-md border border-lime-600 bg-lime-500/10 px-3 py-1.5 text-sm font-medium text-lime-400 transition hover:bg-lime-500/20"
      >
        Descargar inventario en PDF
      </a>
    </div>
  );
}
