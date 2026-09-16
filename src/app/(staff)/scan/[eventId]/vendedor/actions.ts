"use server";

import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyStaffSession, STAFF_COOKIE_NAME } from "@/lib/staff-session";
import type { ActionResult } from "@/lib/action-result";

export async function registerGuest(
  eventId: string,
  input: { ticketTypeId: string; name: string; phone: string },
): Promise<ActionResult<{ ticketId: string }>> {
  const cookieStore = await cookies();
  const token = cookieStore.get(STAFF_COOKIE_NAME)?.value;
  const session = token ? await verifyStaffSession(token) : null;

  if (!session || session.eventId !== eventId) {
    return { error: "Sesión de staff inválida, volvé a ingresar por el link." };
  }
  if (!input.name.trim() || !input.phone.trim()) {
    return { error: "Completá nombre y WhatsApp" };
  }

  const admin = createAdminClient();

  const { data: ticketType, error: typeError } = await admin
    .from("ticket_types")
    .select("id, price_cents, active")
    .eq("id", input.ticketTypeId)
    .eq("event_id", eventId)
    .single();

  if (typeError || !ticketType || !ticketType.active) {
    return { error: "Tipo de entrada inválido" };
  }

  const { data: guest, error: guestError } = await admin
    .from("guests")
    .insert({ name: input.name.trim(), phone: input.phone.trim() })
    .select("id")
    .single();

  if (guestError || !guest) {
    return { error: guestError?.message ?? "No se pudo registrar el invitado" };
  }

  const qrCode = nanoid(21);

  const { data: ticket, error: ticketError } = await admin
    .from("tickets")
    .insert({
      qr_code: qrCode,
      event_id: eventId,
      ticket_type_id: ticketType.id,
      guest_id: guest.id,
      price_cents: ticketType.price_cents,
      status: "approved",
    })
    .select("id")
    .single();

  if (ticketError || !ticket) {
    return { error: ticketError?.message ?? "No se pudo generar el ticket" };
  }

  return { ticketId: ticket.id as string };
}
