"use server";

import { z } from "zod";
import { nanoid } from "nanoid";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult } from "@/lib/action-result";

const manualSaleSchema = z.object({
  ticketTypeId: z.string().uuid(),
  name: z.string().min(1, "Requerido"),
  phone: z.string().min(1, "Requerido"),
});

const MAX_PROOF_BYTES = 8 * 1024 * 1024;

export async function createManualSale(
  eventId: string,
  formData: FormData,
): Promise<ActionResult<{ ticketId: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesión inválida, volvé a iniciar sesión." };
  }

  const parsedInput = manualSaleSchema.safeParse({
    ticketTypeId: formData.get("ticketTypeId"),
    name: formData.get("name"),
    phone: formData.get("phone"),
  });
  if (!parsedInput.success) {
    return { error: "Datos inválidos" };
  }
  const parsed = parsedInput.data;

  const admin = createAdminClient();

  const { data: ticketType, error: typeError } = await admin
    .from("ticket_types")
    .select("id, event_id, price_cents, active, events(created_by)")
    .eq("id", parsed.ticketTypeId)
    .eq("event_id", eventId)
    .single();

  const event = ticketType?.events as unknown as { created_by: string } | undefined;

  if (typeError || !ticketType || !ticketType.active || event?.created_by !== user.id) {
    return { error: "Tipo de entrada inválido" };
  }

  let paymentProofPath: string | null = null;
  const proof = formData.get("proof");
  if (proof instanceof File && proof.size > 0) {
    if (proof.size > MAX_PROOF_BYTES) {
      return { error: "La foto es demasiado grande (máx. 8MB)" };
    }
    const path = `${eventId}/${nanoid()}-${proof.name}`;
    const { error: uploadError } = await admin.storage
      .from("payment-proofs")
      .upload(path, proof, { contentType: proof.type });

    if (uploadError) return { error: uploadError.message };
    paymentProofPath = path;
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
      payment_proof_path: paymentProofPath,
    })
    .select("id")
    .single();

  if (ticketError || !ticket) {
    return { error: ticketError?.message ?? "No se pudo generar el ticket" };
  }

  return { ticketId: ticket.id as string };
}
