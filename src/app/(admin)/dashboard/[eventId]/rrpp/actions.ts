"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createRrpp(eventId: string, name: string, code: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { error } = await supabase
    .from("rrpp")
    .insert({ name, code, created_by: user.id });

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/${eventId}/rrpp`);
}

export async function toggleRrppActive(id: string, eventId: string, active: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("rrpp").update({ active }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/${eventId}/rrpp`);
}
