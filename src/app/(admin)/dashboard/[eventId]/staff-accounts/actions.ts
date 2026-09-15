"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hashPassword } from "@/lib/password";
import { generateQrDataUrl } from "@/lib/qr";
import type { StaffRole } from "@/lib/staff-session";

export async function createStaffCredential(
  eventId: string,
  username: string,
  role: StaffRole,
  password: string,
  whatsappNumber?: string,
  payCents?: number,
) {
  if (password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres");
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
    if (error.code === "23505") throw new Error("Ese usuario ya existe para este evento");
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/${eventId}/staff-accounts`);
  return { id: data.id as string };
}

export async function setStaffPassword(id: string, eventId: string, newPassword: string) {
  if (newPassword.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres");
  }

  const supabase = await createClient();
  const passwordHash = await hashPassword(newPassword);

  const { error } = await supabase
    .from("staff_credentials")
    .update({ password_hash: passwordHash })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/${eventId}/staff-accounts`);
}

export async function setStaffUsername(id: string, eventId: string, newUsername: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("staff_credentials")
    .update({ username: newUsername.trim() })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") throw new Error("Ese usuario ya existe para este evento");
    throw new Error(error.message);
  }
  revalidatePath(`/dashboard/${eventId}/staff-accounts`);
}

export async function setStaffPay(id: string, eventId: string, payCents: number) {
  if (payCents < 0) {
    throw new Error("El sueldo no puede ser negativo");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("staff_credentials").update({ pay_cents: payCents }).eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/${eventId}/staff-accounts`);
}

export async function grantCreditToAll(eventId: string, message: string, amountCents: number) {
  if (!message.trim()) {
    throw new Error("Escribí un mensaje");
  }
  if (amountCents <= 0) {
    throw new Error("El monto debe ser mayor a 0");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("grant_staff_credit", {
    p_event_id: eventId,
    p_message: message.trim(),
    p_amount_cents: amountCents,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/${eventId}/staff-accounts`);
  return { count: data as number };
}

export async function toggleStaffActive(id: string, eventId: string, active: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("staff_credentials").update({ active }).eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/${eventId}/staff-accounts`);
}

export async function deleteStaffCredential(id: string, eventId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("staff_credentials").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/${eventId}/staff-accounts`);
}

export async function getLoginQr(loginUrl: string) {
  return generateQrDataUrl(loginUrl);
}
