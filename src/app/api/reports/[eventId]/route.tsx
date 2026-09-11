import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { EventReportDocument, type EventReportData } from "@/lib/pdf/event-report";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const [{ data: event }, { data: stats }, { data: breakdown }, { data: rrppStats }, { data: scans }] =
    await Promise.all([
      supabase.from("events").select("name, venue, created_by").eq("id", eventId).single(),
      supabase.from("event_stats").select("*").eq("event_id", eventId).maybeSingle(),
      supabase.from("ticket_type_breakdown").select("*").eq("event_id", eventId).order("sort_order"),
      supabase.from("rrpp_stats").select("*").eq("event_id", eventId),
      supabase
        .from("scans")
        .select("scanned_at, tickets(guests(name), ticket_types(name))")
        .eq("event_id", eventId)
        .order("scanned_at"),
    ]);

  if (!event || event.created_by !== user.id) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const data: EventReportData = {
    eventName: event.name,
    venue: event.venue,
    generatedAt: new Date().toISOString(),
    stats: {
      totalTickets: stats?.total_tickets ?? 0,
      checkedIn: stats?.checked_in_count ?? 0,
      revenueCents: stats?.total_revenue_cents ?? 0,
    },
    breakdown: (breakdown ?? []).map((b) => ({
      name: b.name,
      qty: b.qty,
      revenueCents: b.revenue_cents,
    })),
    rrpp: (rrppStats ?? []).map((r) => ({
      name: r.name,
      totalTickets: r.total_tickets,
      usedTickets: r.used_tickets,
      revenueCents: r.revenue_cents,
    })),
    attendees: (scans ?? []).map((s) => {
      const ticket = s.tickets as unknown as {
        guests: { name: string } | null;
        ticket_types: { name: string } | null;
      } | null;
      return {
        name: ticket?.guests?.name ?? "—",
        ticketType: ticket?.ticket_types?.name ?? "—",
        scannedAt: s.scanned_at,
      };
    }),
  };

  const buffer = await renderToBuffer(<EventReportDocument data={data} />);

  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="reporte-${event.name.replace(/[^a-z0-9]+/gi, "-")}.pdf"`,
    },
  });
}
