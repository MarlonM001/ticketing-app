"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/action-result";

export async function createRrpp(
  eventId: string,
  name: string,
  code: string,
): Promise<ActionResult<{ ok: true }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("rrpp")
    .insert({ name, code, created_by: user.id });

  if (error) {
    if (error.code === "23505") return { error: "Ese código ya está en uso" };
    return { error: error.message };
  }
  revalidatePath(`/dashboard/${eventId}/rrpp`);
  return { ok: true };
}

export async function toggleRrppActive(
  id: string,
  eventId: string,
  active: boolean,
): Promise<ActionResult<{ ok: true }>> {
  const supabase = await createClient();
  const { error } = await supabase.from("rrpp").update({ active }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${eventId}/rrpp`);
  return { ok: true };
}
