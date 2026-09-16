import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getInventoryRows, sumInventoryTotals } from "@/lib/inventory";
import { InventoryReportDocument, type InventoryReportData } from "@/lib/pdf/inventory-report";

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

  const { data: event } = await supabase
    .from("events")
    .select("name, created_by")
    .eq("id", eventId)
    .single();

  if (!event || event.created_by !== user.id) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const rows = await getInventoryRows(eventId);
  const totals = sumInventoryTotals(rows);

  const data: InventoryReportData = {
    eventName: event.name,
    generatedAt: new Date().toISOString(),
    products: rows.map((r) => ({
      name: r.name,
      initialStock: r.initialStock,
      finalStock: r.finalStock,
      qty: r.qtySold,
      courtesyQty: r.courtesyQty,
      revenueCents: r.revenueCents,
    })),
    totals,
  };

  const buffer = await renderToBuffer(<InventoryReportDocument data={data} />);

  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="inventario-${event.name.replace(/[^a-z0-9]+/gi, "-")}.pdf"`,
    },
  });
}
