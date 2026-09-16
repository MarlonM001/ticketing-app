"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/action-result";

export async function resolveAlert(
  alertId: string,
  eventId: string,
): Promise<ActionResult<{ ok: true }>> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("staff_alerts")
    .update({ resolved: true })
    .eq("id", alertId);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${eventId}`);
  return { ok: true };
}
