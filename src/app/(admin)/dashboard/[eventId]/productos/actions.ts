"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/action-result";

export async function createProduct(
  eventId: string,
  input: { name: string; priceCents: number; stockQuantity: number | null },
): Promise<ActionResult<{ ok: true }>> {
  const supabase = await createClient();
  const { error } = await supabase.from("products").insert({
    event_id: eventId,
    name: input.name,
    price_cents: input.priceCents,
    stock_quantity: input.stockQuantity,
  });

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${eventId}/productos`);
  return { ok: true };
}

export async function updateProduct(
  productId: string,
  eventId: string,
  input: { name: string; priceCents: number; stockQuantity: number | null },
): Promise<ActionResult<{ ok: true }>> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({
      name: input.name,
      price_cents: input.priceCents,
      stock_quantity: input.stockQuantity,
    })
    .eq("id", productId);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${eventId}/productos`);
  return { ok: true };
}

// Si el producto ya tiene ventas registradas, borrarlo rompería el historial
// de reportes (product_sales.product_id lo referencia). En ese caso se
// desactiva en vez de borrarlo, igual que ticket_types/rrpp.
export async function deleteProduct(
  productId: string,
  eventId: string,
): Promise<ActionResult<{ ok: true }>> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("product_sales")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  if (count && count > 0) {
    const { error } = await supabase
      .from("products")
      .update({ active: false })
      .eq("id", productId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("products").delete().eq("id", productId);
    if (error) return { error: error.message };
  }

  revalidatePath(`/dashboard/${eventId}/productos`);
  return { ok: true };
}

export async function setProductActive(
  productId: string,
  eventId: string,
  active: boolean,
): Promise<ActionResult<{ ok: true }>> {
  const supabase = await createClient();
  const { error } = await supabase.from("products").update({ active }).eq("id", productId);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${eventId}/productos`);
  return { ok: true };
}
