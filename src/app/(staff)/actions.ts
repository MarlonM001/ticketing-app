"use server";

import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyStaffSession, STAFF_COOKIE_NAME, type StaffRole } from "@/lib/staff-session";

export type OrderResult = {
  result: "ok" | "invalid_product" | "out_of_stock" | "invalid_quantity";
  product_name: string | null;
  remaining_stock: number | null;
  used_credit: boolean;
};

// Cualquier rol de staff puede pedir un producto para consumo propio. Si
// tiene crédito de cortesía suficiente (regalado por el organizador), se
// descuenta de ahí primero y la venta no cuenta como recaudación ni resta
// sueldo; si no alcanza, se carga a su sueldo como antes.
export async function orderForSelf(productId: string): Promise<OrderResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get(STAFF_COOKIE_NAME)?.value;
  const session = token ? await verifyStaffSession(token) : null;

  if (!session) {
    throw new Error("Sesión de staff inválida, volvé a ingresar por el link.");
  }

  const admin = createAdminClient();

  const [{ data: product }, { data: staffRow }] = await Promise.all([
    admin.from("products").select("price_cents").eq("id", productId).single(),
    admin.from("staff_credentials").select("credit_cents").eq("id", session.staffId).single(),
  ]);

  const useCredit = !!product && !!staffRow && staffRow.credit_cents >= product.price_cents;

  const { data, error } = await admin
    .rpc("record_sale", {
      p_event_id: session.eventId,
      p_product_id: productId,
      p_quantity: 1,
      p_sold_by: session.label,
      p_charged_to_staff_id: useCredit ? null : session.staffId,
      p_is_courtesy: useCredit,
    })
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Error al registrar el pedido");
  }

  const result = data as Omit<OrderResult, "used_credit">;

  if (useCredit && result.result === "ok" && product && staffRow) {
    await admin
      .from("staff_credentials")
      .update({ credit_cents: staffRow.credit_cents - product.price_cents })
      .eq("id", session.staffId);
  }

  return { ...result, used_credit: useCredit && result.result === "ok" };
}

// Aviso puntual de un rol de staff a otro (ej: DJ avisándole algo a Caja).
// Reusa staff_alerts con target_role: sin target va al organizador (como
// el botón "Alertar" de Puerta), con target aparece en la pantalla de ese
// rol en tiempo real.
export async function notifyRole(targetRole: StaffRole, message: string) {
  if (!message.trim()) {
    throw new Error("Escribí un mensaje");
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(STAFF_COOKIE_NAME)?.value;
  const session = token ? await verifyStaffSession(token) : null;

  if (!session) {
    throw new Error("Sesión de staff inválida, volvé a ingresar por el link.");
  }

  const admin = createAdminClient();
  const { error } = await admin.from("staff_alerts").insert({
    event_id: session.eventId,
    label: session.label,
    reason: message.trim(),
    target_role: targetRole,
  });

  if (error) throw new Error(error.message);
}

export type StaffNotification = {
  id: string;
  label: string;
  reason: string | null;
  created_at: string;
};

export async function resolveNotification(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(STAFF_COOKIE_NAME)?.value;
  const session = token ? await verifyStaffSession(token) : null;

  if (!session) {
    throw new Error("Sesión de staff inválida, volvé a ingresar por el link.");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("staff_alerts")
    .update({ resolved: true })
    .eq("id", id)
    .eq("event_id", session.eventId);

  if (error) throw new Error(error.message);
}
