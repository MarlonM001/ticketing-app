import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyStaffSession, STAFF_COOKIE_NAME } from "@/lib/staff-session";
import StaffRealtimeRefresher from "../../realtime-refresher";
import Pos from "./pos";

export default async function CajaPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(STAFF_COOKIE_NAME)?.value;
  const session = token ? await verifyStaffSession(token) : null;

  if (!session || session.role !== "caja" || session.eventId !== eventId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 text-center text-neutral-400">
        Sesión de staff inválida, volvé a ingresar por el link de acceso.
      </div>
    );
  }

  const admin = createAdminClient();
  const [{ data: products }, { data: staffAccounts }, { data: notifications }, { data: self }] =
    await Promise.all([
      admin
        .from("products")
        .select("id, name, price_cents, stock_quantity")
        .eq("event_id", eventId)
        .eq("active", true)
        .order("sort_order")
        .order("created_at"),
      admin
        .from("staff_credentials")
        .select("id, username, role")
        .eq("event_id", eventId)
        .eq("active", true)
        .order("role")
        .order("username"),
      admin
        .from("staff_alerts")
        .select("id, label, reason, created_at")
        .eq("event_id", eventId)
        .eq("target_role", "caja")
        .eq("resolved", false)
        .order("created_at", { ascending: false }),
      admin
        .from("staff_credentials")
        .select("credit_cents, credit_message")
        .eq("id", session.staffId)
        .single(),
    ]);

  // El propio staff de caja no aparece en "Cobrar a": para consumo propio
  // usa el botón "Pedir algo", que descuenta de su sueldo sin pasar por la
  // venta en efectivo.
  const otherStaffAccounts = (staffAccounts ?? []).filter((a) => a.id !== session.staffId);

  return (
    <>
      <StaffRealtimeRefresher eventId={eventId} />
      <Pos
        label={session.label}
        products={products ?? []}
        staffAccounts={otherStaffAccounts}
        notifications={notifications ?? []}
        creditCents={self?.credit_cents ?? 0}
        creditMessage={self?.credit_message ?? null}
      />
    </>
  );
}
