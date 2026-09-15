import { createClient } from "@/lib/supabase/server";
import ProductosClient from "./productos-client";

export default async function ProductosPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, price_cents, stock_quantity, active")
    .eq("event_id", eventId)
    .order("sort_order")
    .order("created_at");

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Productos de barra</h1>
      <ProductosClient eventId={eventId} initialProducts={products ?? []} />
    </div>
  );
}
