"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/action-result";

const ticketTypeSchema = z.object({
  name: z.string().min(1),
  price_cents: z.number().int().min(0),
  is_staff_type: z.boolean(),
});

const createEventSchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  venue: z.string().optional(),
  starts_at: z.string().optional(),
  whatsapp_number: z.string().min(1, "Requerido para tickets pagos"),
  whatsapp_message_template: z.string().min(1),
  ticket_types: z.array(ticketTypeSchema).min(1),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

// Productos típicos de barra para que el evento no arranque vacío. El
// organizador les pone precio real (quedan en $0) y puede sumar o borrar
// desde "Productos" cuando quiera.
const DEFAULT_BAR_PRODUCTS = [
  "Cerveza",
  "Cerveza Michelada",
  "Gaseosa",
  "Agua",
  "Agua Saborizada",
  "Jugo",
  "Energizante",
  "Hielo",
  "Aguardiente Botella",
  "Aguardiente Shot",
  "Ron Botella",
  "Ron Shot",
  "Whisky Botella",
  "Whisky Shot",
  "Vodka Botella",
  "Vodka Shot",
  "Tequila Botella",
  "Tequila Shot",
  "Mojito",
  "Piña Colada",
  "Margarita",
  "Cuba Libre",
  "Trago Mixto",
  "Cigarrillos",
  "Picada",
];

export async function createEvent(
  input: CreateEventInput,
): Promise<ActionResult<{ eventId: string }>> {
  const parsedInput = createEventSchema.safeParse(input);
  if (!parsedInput.success) {
    return { error: parsedInput.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const parsed = parsedInput.data;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data: event, error: eventError } = await supabase
    .from("events")
    .insert({
      name: parsed.name,
      slug: parsed.slug,
      venue: parsed.venue || null,
      starts_at: parsed.starts_at || null,
      whatsapp_number: parsed.whatsapp_number,
      whatsapp_message_template: parsed.whatsapp_message_template,
      status: "published",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (eventError || !event) {
    return { error: eventError?.message ?? "No se pudo crear el evento" };
  }

  const { error: typesError } = await supabase.from("ticket_types").insert(
    parsed.ticket_types.map((tt, index) => ({
      event_id: event.id,
      name: tt.name,
      price_cents: tt.price_cents,
      is_staff_type: tt.is_staff_type,
      sort_order: index,
    })),
  );

  if (typesError) {
    return { error: typesError.message };
  }

  const { error: productsError } = await supabase.from("products").insert(
    DEFAULT_BAR_PRODUCTS.map((name, index) => ({
      event_id: event.id,
      name,
      price_cents: 0,
      sort_order: index,
    })),
  );

  if (productsError) {
    return { error: productsError.message };
  }

  return { eventId: event.id as string };
}

// Borra el evento y todo lo que cuelga de él (entradas, ventas, staff,
// etc.) por los "on delete cascade" del esquema. Es irreversible.
export async function deleteEvent(eventId: string): Promise<ActionResult<{ ok: true }>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId)
    .eq("created_by", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}
