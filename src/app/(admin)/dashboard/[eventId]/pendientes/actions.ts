"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function approveTicket(ticketId: string, eventId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tickets")
    .update({ status: "approved" })
    .eq("id", ticketId);

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/${eventId}/pendientes`);
}

export async function rejectTicket(ticketId: string, eventId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tickets")
    .update({ status: "rejected" })
    .eq("id", ticketId);

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/${eventId}/pendientes`);
}
