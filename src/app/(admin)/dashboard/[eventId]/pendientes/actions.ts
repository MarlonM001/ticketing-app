"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/action-result";

export async function approveTicket(
  ticketId: string,
  eventId: string,
): Promise<ActionResult<{ ok: true }>> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tickets")
    .update({ status: "approved" })
    .eq("id", ticketId);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${eventId}/pendientes`);
  return { ok: true };
}

export async function rejectTicket(
  ticketId: string,
  eventId: string,
): Promise<ActionResult<{ ok: true }>> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tickets")
    .update({ status: "rejected" })
    .eq("id", ticketId);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${eventId}/pendientes`);
  return { ok: true };
}
