"use client";

import { useTransition } from "react";
import { resolveAlert } from "./alerts-actions";

type Alert = { id: string; label: string; reason: string | null; created_at: string };

export default function AlertsBanner({
  eventId,
  alerts,
}: {
  eventId: string;
  alerts: Alert[];
}) {
  const [isPending, startTransition] = useTransition();

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="flex items-center justify-between rounded-lg border border-red-600 bg-red-950/40 p-3 text-sm text-red-200"
        >
          <div>
            <p className="font-semibold">
              🚨 Alerta de {alert.label}
              {alert.reason ? ` — ${alert.reason}` : ""}
            </p>
            <p className="text-xs text-red-300/80">
              {new Date(alert.created_at).toLocaleTimeString("es-AR")}
            </p>
          </div>
          <button
            disabled={isPending}
            onClick={() => startTransition(() => resolveAlert(alert.id, eventId))}
            className="rounded-md border border-red-400 px-3 py-1 text-red-200 disabled:opacity-50"
          >
            Resolver
          </button>
        </div>
      ))}
    </div>
  );
}
