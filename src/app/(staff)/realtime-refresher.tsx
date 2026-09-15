"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Refresca la pantalla del staff sola para que le lleguen los avisos
// nuevos (ej: DJ avisándole algo a Caja) sin recargar a mano. Usa polling
// en vez de Supabase Realtime porque las sesiones de staff no tienen login
// de Supabase Auth (son un JWT propio), así que una conexión realtime
// anónima no pasaría el RLS de staff_alerts.
const POLL_MS = 8000;

export default function StaffRealtimeRefresher({ eventId }: { eventId: string }) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => router.refresh(), POLL_MS);
    return () => clearInterval(interval);
  }, [eventId, router]);

  return null;
}
