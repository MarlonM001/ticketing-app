"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateTicket(
  ticketId: string,
  eventId: string,
  input: { guestName: string; guestPhone: string; ticketTypeId: string },
) {
  const supabase = await createClient();

  const { data: ticket, error: ticketFetchError } = await supabase
    .from("tickets")
    .select("guest_id")
    .eq("id", ticketId)
    .single();

  if (ticketFetchError || !ticket) {
    throw new Error(ticketFetchError?.message ?? "Ticket no encontrado");
  }

  const { data: ticketType, error: typeError } = await supabase
    .from("ticket_types")
    .select("price_cents")
    .eq("id", input.ticketTypeId)
    .single();

  if (typeError || !ticketType) {
    throw new Error(typeError?.message ?? "Tipo de entrada inválido");
  }

  const { error: guestError } = await supabase
    .from("guests")
    .update({ name: input.guestName, phone: input.guestPhone })
    .eq("id", ticket.guest_id);

  if (guestError) throw new Error(guestError.message);

  const { error: ticketError } = await supabase
    .from("tickets")
    .update({ ticket_type_id: input.ticketTypeId, price_cents: ticketType.price_cents })
    .eq("id", ticketId);

  if (ticketError) throw new Error(ticketError.message);

  revalidatePath(`/dashboard/${eventId}/invitados`);
}

export async function cancelTicket(ticketId: string, eventId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tickets")
    .update({ status: "rejected" })
    .eq("id", ticketId);

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/${eventId}/invitados`);
}

export async function reinstateTicket(ticketId: string, eventId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tickets")
    .update({ status: "approved" })
    .eq("id", ticketId);

  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/${eventId}/invitados`);
}
