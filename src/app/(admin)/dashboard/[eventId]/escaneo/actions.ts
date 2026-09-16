"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ScanResult } from "@/components/qr-scanner";

export async function scanTicketAsAdmin(eventId: string, qrCode: string): Promise<ScanResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sesión inválida, volvé a iniciar sesión.");
  }

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) {
    throw new Error("Evento no encontrado.");
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .rpc("scan_ticket", { p_qr_code: qrCode, p_scanned_by: user.email ?? "Admin" })
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Error al escanear");
  }

  return data as ScanResult;
}
