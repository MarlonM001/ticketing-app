import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EventCard from "./event-card";

export default async function DashboardHomePage() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, name, venue, starts_at, status")
    .order("created_at", { ascending: false });

  if (!events || events.length === 0) {
    return (
      <div className="text-neutral-400">
        Todavía no creaste ningún evento.{" "}
        <Link href="/dashboard/eventos/nuevo" className="text-lime-400">
          Crear el primero
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
