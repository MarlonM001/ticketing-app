import { createClient } from "@/lib/supabase/server";
import VenderClient from "./vender-client";

export default async function VenderPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, price_cents, stock_quantity")
    .eq("event_id", eventId)
    .eq("active", true)
    .order("sort_order")
    .order("created_at");

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Vender</h1>
      <VenderClient eventId={eventId} products={products ?? []} />
    </div>
  );
}
