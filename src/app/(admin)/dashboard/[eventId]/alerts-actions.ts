"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function resolveAlert(alertId: string, eventId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("staff_alerts")
    .update({ resolved: true })
    .eq("id", alertId);

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/${eventId}`);
}
