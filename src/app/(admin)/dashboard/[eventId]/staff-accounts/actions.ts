"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hashPassword } from "@/lib/password";
import { generateQrDataUrl } from "@/lib/qr";
import type { StaffRole } from "@/lib/staff-session";
import type { ActionResult } from "@/lib/action-result";

export async function createStaffCredential(
  eventId: string,
  username: string,
  role: StaffRole,
  password: string,
  whatsappNumber?: string,
  payCents?: number,
): Promise<ActionResult<{ id: string }>> {
  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres" };
  }

  const supabase = await createClient();
  const passwordHash = await hashPassword(password);

  const { data, error } = await supabase
    .from("staff_credentials")
    .insert({
      event_id: eventId,
      username: username.trim(),
      password_hash: passwordHash,
      role,
      whatsapp_number: whatsappNumber?.trim() || null,
      pay_cents: payCents && payCents > 0 ? payCents : 0,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { error: "Ese usuario ya existe para este evento" };
    return { error: error.message };
  }

  revalidatePath(`/dashboard/${eventId}/staff-accounts`);
  return { id: data.id as string };
}

export async function setStaffPassword(
  id: string,
  eventId: string,
  newPassword: string,
): Promise<ActionResult<{ ok: true }>> {
  if (newPassword.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres" };
  }

  const supabase = await createClient();
  const passwordHash = await hashPassword(newPassword);

  const { error } = await supabase
    .from("staff_credentials")
    .update({ password_hash: passwordHash })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${eventId}/staff-accounts`);
  return { ok: true };
}

export async function setStaffUsername(
  id: string,
  eventId: string,
  newUsername: string,
): Promise<ActionResult<{ ok: true }>> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("staff_credentials")
    .update({ username: newUsername.trim() })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") return { error: "Ese usuario ya existe para este evento" };
    return { error: error.message };
  }
  revalidatePath(`/dashboard/${eventId}/staff-accounts`);
  return { ok: true };
}

export async function setStaffPay(
  id: string,
  eventId: string,
  payCents: number,
): Promise<ActionResult<{ ok: true }>> {
  if (payCents < 0) {
    return { error: "El sueldo no puede ser negativo" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("staff_credentials").update({ pay_cents: payCents }).eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${eventId}/staff-accounts`);
  return { ok: true };
}

export async function grantCreditToAll(
  eventId: string,
  message: string,
  amountCents: number,
): Promise<ActionResult<{ count: number }>> {
  if (!message.trim()) {
    return { error: "Escribí un mensaje" };
  }
  if (amountCents <= 0) {
    return { error: "El monto debe ser mayor a 0" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("grant_staff_credit", {
    p_event_id: eventId,
    p_message: message.trim(),
    p_amount_cents: amountCents,
  });

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${eventId}/staff-accounts`);
  return { count: data as number };
}

export async function toggleStaffActive(
  id: string,
  eventId: string,
  active: boolean,
): Promise<ActionResult<{ ok: true }>> {
  const supabase = await createClient();
  const { error } = await supabase.from("staff_credentials").update({ active }).eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${eventId}/staff-accounts`);
  return { ok: true };
}

export async function deleteStaffCredential(
  id: string,
  eventId: string,
): Promise<ActionResult<{ ok: true }>> {
  const supabase = await createClient();
  const { error } = await supabase.from("staff_credentials").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/${eventId}/staff-accounts`);
  return { ok: true };
}

export async function getLoginQr(loginUrl: string) {
  return generateQrDataUrl(loginUrl);
}
