import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyStaffSession, STAFF_COOKIE_NAME } from "@/lib/staff-session";
import RoleIcon from "@/components/role-icon";
import VendedorClient from "./vendedor-client";

export default async function VendedorPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(STAFF_COOKIE_NAME)?.value;
  const session = token ? await verifyStaffSession(token) : null;

  if (!session || session.eventId !== eventId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 text-center text-neutral-400">
        Sesión de staff inválida, volvé a ingresar por el link de acceso.
      </div>
    );
  }

  const admin = createAdminClient();
  const { data: ticketTypes } = await admin
    .from("ticket_types")
    .select("id, name, price_cents")
    .eq("event_id", eventId)
    .eq("active", true)
    .order("sort_order");

  return (
    <div className="min-h-screen bg-neutral-950 p-4 text-white">
      <p className="mb-4 flex items-center gap-1.5 text-sm text-neutral-400">
        <RoleIcon role="vendedor" className="h-4 w-4 text-lime-400" />
        Vendedor · {session.label}
      </p>
      <VendedorClient eventId={eventId} ticketTypes={ticketTypes ?? []} />
    </div>
  );
}
