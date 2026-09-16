"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/lib/action-result";

export type SaleResult = {
  result: "ok" | "invalid_product" | "out_of_stock" | "invalid_quantity";
  product_name: string | null;
  remaining_stock: number | null;
};

export async function sellProductAsAdmin(
  eventId: string,
  productId: string,
  quantity: number,
): Promise<ActionResult<SaleResult>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesión inválida, volvé a iniciar sesión." };
  }

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) {
    return { error: "Evento no encontrado." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .rpc("record_sale", {
      p_event_id: eventId,
      p_product_id: productId,
      p_quantity: quantity,
      p_sold_by: user.email ?? "Admin",
    })
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Error al registrar la venta" };
  }

  return data as SaleResult;
}
