import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyStaffSession, STAFF_COOKIE_NAME } from "@/lib/staff-session";
import Scanner from "./scanner";

export default async function ScanPage({
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
  const [{ data: products }, { data: self }] = await Promise.all([
    admin
      .from("products")
      .select("id, name, price_cents, stock_quantity")
      .eq("event_id", eventId)
      .eq("active", true)
      .order("sort_order")
      .order("created_at"),
    admin.from("staff_credentials").select("credit_cents, credit_message").eq("id", session.staffId).single(),
  ]);

  return (
    <Scanner
      products={products ?? []}
      creditCents={self?.credit_cents ?? 0}
      creditMessage={self?.credit_message ?? null}
    />
  );
}
