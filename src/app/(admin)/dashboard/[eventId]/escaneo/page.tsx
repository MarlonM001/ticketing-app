import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ScannerAdmin from "./scanner-admin";

export default async function EscaneoPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: event } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) {
    notFound();
  }

  return <ScannerAdmin eventId={eventId} />;
}
