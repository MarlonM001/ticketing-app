import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "./sign-out-button";
import EventSwitcher from "./event-switcher";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: events } = await supabase
    .from("events")
    .select("id, name, status")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <span className="font-semibold">Panel</span>
          <EventSwitcher events={events ?? []} />
          <Link href="/dashboard/eventos/nuevo" className="text-sm text-lime-400">
            + Nuevo evento
          </Link>
        </div>
        <SignOutButton />
      </header>
      <main className="p-4 sm:p-6">{children}</main>
    </div>
  );
}
