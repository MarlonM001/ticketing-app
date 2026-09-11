import { createClient } from "@/lib/supabase/server";
import RrppClient from "./rrpp-client";

export default async function RrppPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createClient();

  const [{ data: event }, { data: rrppList }, { data: stats }] = await Promise.all([
    supabase.from("events").select("slug").eq("id", eventId).single(),
    supabase.from("rrpp").select("id, name, code, active").order("name"),
    supabase.from("rrpp_stats").select("*").eq("event_id", eventId),
  ]);

  const statsByRrpp = new Map((stats ?? []).map((s) => [s.rrpp_id, s]));

  const rows = (rrppList ?? []).map((r) => {
    const s = statsByRrpp.get(r.id);
    return {
      id: r.id,
      name: r.name,
      code: r.code,
      active: r.active,
      total_tickets: s?.total_tickets ?? 0,
      approved_tickets: s?.approved_tickets ?? 0,
      used_tickets: s?.used_tickets ?? 0,
      revenue_cents: s?.revenue_cents ?? 0,
      courtesy_count: s?.courtesy_count ?? 0,
    };
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Vendedores / RRPP</h1>
      <RrppClient eventId={eventId} eventSlug={event?.slug ?? ""} rows={rows} />
    </div>
  );
}
