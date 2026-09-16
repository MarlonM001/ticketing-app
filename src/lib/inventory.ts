import { createClient } from "@/lib/supabase/server";

export type InventoryRow = {
  id: string;
  name: string;
  active: boolean;
  initialStock: number | null;
  finalStock: number | null;
  qtySold: number;
  courtesyQty: number;
  revenueCents: number;
};

// El stock actual del producto ya es el "final" (se descuenta en cada
// venta); el "inicial" se reconstruye sumándole lo vendido, sin necesidad
// de guardar un snapshot aparte. Se usa tanto en la pantalla de inventario
// como en el PDF dedicado, para no repetir el cálculo en los dos lados.
export async function getInventoryRows(eventId: string): Promise<InventoryRow[]> {
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

  return (products ?? []).map((p) => {
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
}

export function sumInventoryTotals(rows: InventoryRow[]) {
  return rows.reduce(
    (acc, r) => ({
      qtySold: acc.qtySold + r.qtySold,
      courtesyQty: acc.courtesyQty + r.courtesyQty,
      revenueCents: acc.revenueCents + r.revenueCents,
    }),
    { qtySold: 0, courtesyQty: 0, revenueCents: 0 },
  );
}
