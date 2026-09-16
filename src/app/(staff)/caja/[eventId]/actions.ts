"use server";

import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyStaffSession, STAFF_COOKIE_NAME } from "@/lib/staff-session";
import type { ActionResult } from "@/lib/action-result";

export type SaleResult = {
  result: "ok" | "invalid_product" | "out_of_stock" | "invalid_quantity";
  product_name: string | null;
  remaining_stock: number | null;
};

export async function sellProduct(
  productId: string,
  quantity: number,
  chargeToStaffId?: string,
): Promise<ActionResult<SaleResult>> {
  const cookieStore = await cookies();
  const token = cookieStore.get(STAFF_COOKIE_NAME)?.value;
  const session = token ? await verifyStaffSession(token) : null;

  if (!session || session.role !== "caja") {
    return { error: "Sesión de staff inválida, volvé a ingresar por el link." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .rpc("record_sale", {
      p_event_id: session.eventId,
      p_product_id: productId,
      p_quantity: quantity,
      p_sold_by: session.label,
      p_charged_to_staff_id: chargeToStaffId ?? null,
    })
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Error al registrar la venta" };
  }

  return data as SaleResult;
}
