"use server";

import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { signStaffSession, verifyStaffSession, STAFF_COOKIE_NAME } from "@/lib/staff-session";

export async function activateStaffAccess(eventId: string, token: string) {
  const admin = createAdminClient();

  const { data: access } = await admin
    .from("staff_access")
    .select("id, label, revoked, event_id")
    .eq("event_id", eventId)
    .eq("token", token)
    .maybeSingle();

  if (!access || access.revoked) {
    throw new Error("Link inválido o revocado");
  }

  const session = await signStaffSession({ eventId: access.event_id, label: access.label });
  const cookieStore = await cookies();
  cookieStore.set(STAFF_COOKIE_NAME, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return { label: access.label };
}

export type ScanResult = {
  result: "ok" | "already_used" | "pending" | "invalid";
  guest_name: string | null;
  ticket_type_name: string | null;
  scanned_at: string | null;
};

export async function scanTicket(qrCode: string): Promise<ScanResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get(STAFF_COOKIE_NAME)?.value;
  const session = token ? await verifyStaffSession(token) : null;

  if (!session) {
    throw new Error("Sesión de staff inválida, volvé a ingresar por el link.");
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .rpc("scan_ticket", { p_qr_code: qrCode, p_scanned_by: session.label })
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Error al escanear");
  }

  return data as ScanResult;
}
