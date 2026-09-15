import { createClient } from "@/lib/supabase/server";
import StaffAccountsClient from "./staff-accounts-client";

export default async function StaffAccountsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createClient();

  const { data: accounts } = await supabase
    .from("staff_settlement")
    .select(
      "id, username, role, active, last_login_at, whatsapp_number, pay_cents, consumed_cents, net_pay_cents, credit_cents, credit_message",
    )
    .eq("event_id", eventId)
    .order("role")
    .order("username");

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Cuentas de staff</h1>
      <StaffAccountsClient eventId={eventId} initialAccounts={accounts ?? []} />
    </div>
  );
}
