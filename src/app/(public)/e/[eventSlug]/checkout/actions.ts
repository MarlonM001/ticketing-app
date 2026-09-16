"use server";

import { z } from "zod";
import { nanoid } from "nanoid";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildWhatsappUrl } from "@/lib/whatsapp";
import type { ActionResult } from "@/lib/action-result";

const checkoutSchema = z.object({
  ticketTypeId: z.string().uuid(),
  refCode: z.string().optional(),
  name: z.string().min(1, "Requerido"),
  phone: z.string().min(1, "Requerido"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export async function createTicket(
  input: CheckoutInput,
): Promise<ActionResult<{ ticketId: string; whatsappUrl: string | null; isFree: boolean }>> {
  const parsedInput = checkoutSchema.safeParse(input);
  if (!parsedInput.success) {
    return { error: "Datos inválidos" };
  }
  const parsed = parsedInput.data;
  const admin = createAdminClient();

  const { data: ticketType, error: typeError } = await admin
    .from("ticket_types")
    .select("id, event_id, price_cents, name, active")
    .eq("id", parsed.ticketTypeId)
    .single();

  if (typeError || !ticketType || !ticketType.active) {
    return { error: "Tipo de entrada inválido" };
  }

  const { data: event, error: eventError } = await admin
    .from("events")
    .select("id, name, slug, whatsapp_number, whatsapp_message_template, status")
    .eq("id", ticketType.event_id)
    .single();

  if (eventError || !event || event.status !== "published") {
    return { error: "Evento no disponible" };
  }

  let rrppId: string | null = null;
  if (parsed.refCode) {
    const { data: rrpp } = await admin
      .from("rrpp")
      .select("id")
      .eq("code", parsed.refCode)
      .eq("active", true)
      .maybeSingle();
    rrppId = rrpp?.id ?? null;
  }

  const { data: guest, error: guestError } = await admin
    .from("guests")
    .insert({
      name: parsed.name,
      phone: parsed.phone,
    })
    .select("id")
    .single();

  if (guestError || !guest) {
    return { error: guestError?.message ?? "No se pudo registrar el invitado" };
  }

  const isFree = ticketType.price_cents === 0;
  const qrCode = nanoid(21);

  // Las entradas se generan manualmente (venta manual o vendedores), no hay
  // un paso de aprobación intermedio: quedan habilitadas al instante.
  const { data: ticket, error: ticketError } = await admin
    .from("tickets")
    .insert({
      qr_code: qrCode,
      event_id: event.id,
      ticket_type_id: ticketType.id,
      guest_id: guest.id,
      rrpp_id: rrppId,
      price_cents: ticketType.price_cents,
      status: "approved",
    })
    .select("id")
    .single();

  if (ticketError || !ticket) {
    return { error: ticketError?.message ?? "No se pudo generar el ticket" };
  }

  let whatsappUrl: string | null = null;
  if (!isFree && event.whatsapp_number) {
    whatsappUrl = buildWhatsappUrl({
      number: event.whatsapp_number,
      template: event.whatsapp_message_template,
      guestName: parsed.name,
      eventName: event.name,
      ticketTypeName: ticketType.name,
    });
  }

  return { ticketId: ticket.id as string, whatsappUrl, isFree };
}
