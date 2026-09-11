import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CheckoutForm from "./checkout-form";

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventSlug: string }>;
  searchParams: Promise<{ type?: string; ref?: string }>;
}) {
  const { eventSlug } = await params;
  const { type, ref } = await searchParams;

  if (!type) notFound();

  const supabase = await createClient();
  const { data: ticketType } = await supabase
    .from("ticket_types")
    .select("id, name, price_cents, active")
    .eq("id", type)
    .single();

  if (!ticketType || !ticketType.active) notFound();

  return (
    <CheckoutForm
      eventSlug={eventSlug}
      ticketTypeId={ticketType.id}
      ticketTypeName={ticketType.name}
      priceCents={ticketType.price_cents}
      refCode={ref}
    />
  );
}
