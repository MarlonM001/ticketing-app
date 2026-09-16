import Link from "next/link";
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
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Productos de barra</h1>
        <Link
          href={`/dashboard/${eventId}/productos/inventario`}
          className="text-sm text-lime-400"
        >
          Ver inventario →
        </Link>
      </div>
      <ProductosClient eventId={eventId} initialProducts={products ?? []} />
    </div>
  );
}
