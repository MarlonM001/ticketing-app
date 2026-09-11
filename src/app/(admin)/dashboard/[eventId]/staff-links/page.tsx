import { createClient } from "@/lib/supabase/server";
import StaffLinksClient from "./staff-links-client";

export default async function StaffLinksPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createClient();

  const { data: links } = await supabase
    .from("staff_access")
    .select("id, label, token, revoked")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Links de escaneo para staff</h1>
      <StaffLinksClient eventId={eventId} initialLinks={links ?? []} />
    </div>
  );
}
