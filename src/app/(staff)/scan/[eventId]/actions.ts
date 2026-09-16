"use server";

import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPassword } from "@/lib/password";
import {
  signStaffSession,
  verifyStaffSession,
  STAFF_COOKIE_NAME,
  type StaffRole,
} from "@/lib/staff-session";
import type { ScanResult } from "@/components/qr-scanner";

export type { ScanResult } from "@/components/qr-scanner";

export async function loginStaff(
  eventId: string,
  username: string,
  password: string,
  displayName: string,
) {
  if (!displayName.trim()) {
    throw new Error("Ingresá tu nombre");
  }

  const admin = createAdminClient();

  const { data: cred } = await admin
    .from("staff_credentials")
    .select("id, password_hash, role, active")
    .eq("event_id", eventId)
    .ilike("username", username.trim())
    .maybeSingle();

  if (!cred || !cred.active || !(await verifyPassword(password, cred.password_hash))) {
    throw new Error("Usuario o contraseña incorrectos");
  }

  await admin
    .from("staff_credentials")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", cred.id);

  const session = await signStaffSession({
    eventId,
    label: displayName.trim(),
    role: cred.role,
    staffId: cred.id,
  });
  const cookieStore = await cookies();
  cookieStore.set(STAFF_COOKIE_NAME, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return { role: cred.role as StaffRole };
}

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

export async function raiseAlert(reason?: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(STAFF_COOKIE_NAME)?.value;
  const session = token ? await verifyStaffSession(token) : null;

  if (!session) {
    throw new Error("Sesión de staff inválida, volvé a ingresar por el link.");
  }

  const admin = createAdminClient();
  const { error } = await admin.from("staff_alerts").insert({
    event_id: session.eventId,
    label: session.label,
    reason: reason?.trim() || null,
  });

  if (error) throw new Error(error.message);
}
