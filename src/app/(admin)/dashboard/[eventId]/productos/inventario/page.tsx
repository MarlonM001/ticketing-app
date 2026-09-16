import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function InventarioPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createClient();

  const [{ data: products }, { data: salesSummary }, { data: courtesyRows }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, stock_quantity, active")
      .eq("event_id", eventId)
      .order("sort_order")
      .order("created_at"),
    supabase.from("product_sales_summary").select("*").eq("event_id", eventId),
    supabase
      .from("product_sales")
      .select("product_id, quantity")
      .eq("event_id", eventId)
      .eq("is_courtesy", true),
  ]);

  const salesByProduct = new Map(
    (salesSummary ?? []).map((s) => [s.product_id, { qtySold: s.qty_sold, revenueCents: s.revenue_cents }]),
  );
  const courtesyByProduct = new Map<string, number>();
  for (const row of courtesyRows ?? []) {
    courtesyByProduct.set(row.product_id, (courtesyByProduct.get(row.product_id) ?? 0) + row.quantity);
  }

  const rows = (products ?? []).map((p) => {
    const sales = salesByProduct.get(p.id) ?? { qtySold: 0, revenueCents: 0 };
    const finalStock = p.stock_quantity;
    const initialStock = finalStock === null ? null : finalStock + sales.qtySold;
    return {
      id: p.id,
      name: p.name,
      active: p.active,
      initialStock,
      finalStock,
      qtySold: sales.qtySold,
      courtesyQty: courtesyByProduct.get(p.id) ?? 0,
      revenueCents: sales.revenueCents,
    };
  });

  const totals = rows.reduce(
    (acc, r) => ({
      qtySold: acc.qtySold + r.qtySold,
      courtesyQty: acc.courtesyQty + r.courtesyQty,
      revenueCents: acc.revenueCents + r.revenueCents,
    }),
    { qtySold: 0, courtesyQty: 0, revenueCents: 0 },
  );

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
        evento. También se incluye en el reporte PDF descargable.
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
        href={`/api/reports/${eventId}`}
        className="mt-4 inline-block rounded-md border border-lime-600 bg-lime-500/10 px-3 py-1.5 text-sm font-medium text-lime-400 transition hover:bg-lime-500/20"
      >
        Descargar reporte en PDF
      </a>
    </div>
  );
}
