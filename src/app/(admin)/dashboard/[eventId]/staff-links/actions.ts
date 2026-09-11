"use server";

import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createStaffAccess(eventId: string, label: string) {
  const supabase = await createClient();
  const token = nanoid(32);

  const { error } = await supabase
    .from("staff_access")
    .insert({ event_id: eventId, label, token });

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/${eventId}/staff-links`);
}

export async function revokeStaffAccess(id: string, eventId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("staff_access")
    .update({ revoked: true })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/${eventId}/staff-links`);
}
