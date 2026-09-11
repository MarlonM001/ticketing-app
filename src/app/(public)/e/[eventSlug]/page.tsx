import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventSlug: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { eventSlug } = await params;
  const { ref } = await searchParams;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, name, venue, starts_at")
    .eq("slug", eventSlug)
    .eq("status", "published")
    .single();

  if (!event) notFound();

  const { data: ticketTypes } = await supabase
    .from("ticket_types")
    .select("id, name, price_cents")
    .eq("event_id", event.id)
    .eq("active", true)
    .order("sort_order");

  const refQuery = ref ? `&ref=${encodeURIComponent(ref)}` : "";

  return (
    <div className="mx-auto min-h-screen max-w-md bg-neutral-950 px-4 py-8 text-white">
      <h1 className="text-2xl font-bold">{event.name}</h1>
      {event.venue && <p className="text-neutral-400">{event.venue}</p>}
      {event.starts_at && (
        <p className="text-sm text-neutral-500">
          {new Date(event.starts_at).toLocaleString("es-AR", { dateStyle: "full", timeStyle: "short" })}
        </p>
      )}

      <h2 className="mt-8 mb-3 text-sm font-medium uppercase text-neutral-400">
        Elegí tu entrada
      </h2>
      <div className="space-y-2">
        {ticketTypes?.map((tt) => (
          <Link
            key={tt.id}
            href={`/e/${eventSlug}/checkout?type=${tt.id}${refQuery}`}
            className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 hover:border-lime-500"
          >
            <span className="font-medium">{tt.name}</span>
            <span className="text-neutral-300">
              {tt.price_cents === 0 ? "Gratis" : `$${(tt.price_cents / 100).toLocaleString("es-AR")}`}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
