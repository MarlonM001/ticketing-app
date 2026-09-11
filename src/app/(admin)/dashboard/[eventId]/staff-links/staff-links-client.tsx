"use client";

import { useState, useTransition } from "react";
import { createStaffAccess, revokeStaffAccess } from "./actions";

type StaffAccessRow = { id: string; label: string; token: string; revoked: boolean };

export default function StaffLinksClient({
  eventId,
  initialLinks,
}: {
  eventId: string;
  initialLinks: StaffAccessRow[];
}) {
  const [label, setLabel] = useState("");
  const [isPending, startTransition] = useTransition();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  function urlFor(token: string) {
    return `${origin}/scan/${eventId}/acceso?token=${token}`;
  }

  return (
    <div className="max-w-xl space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!label.trim()) return;
          startTransition(async () => {
            await createStaffAccess(eventId, label.trim());
            setLabel("");
          });
        }}
        className="flex gap-2"
      >
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Ej: Puerta 1"
          className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-lime-500 px-4 py-2 font-medium text-neutral-950 disabled:opacity-50"
        >
          Generar link
        </button>
      </form>

      <div className="space-y-2">
        {initialLinks.map((link) => (
          <div
            key={link.id}
            className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 p-3"
          >
            <div>
              <p className="font-medium">{link.label}</p>
              <p className="break-all text-xs text-neutral-500">{urlFor(link.token)}</p>
              {link.revoked && <p className="text-xs text-red-400">Revocado</p>}
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(urlFor(link.token));
                  setCopiedId(link.id);
                  setTimeout(() => setCopiedId(null), 1500);
                }}
                className="rounded-md border border-neutral-700 px-3 py-1 text-sm"
              >
                {copiedId === link.id ? "Copiado" : "Copiar"}
              </button>
              {!link.revoked && (
                <button
                  onClick={() => startTransition(() => revokeStaffAccess(link.id, eventId))}
                  className="rounded-md border border-red-500 px-3 py-1 text-sm text-red-400"
                >
                  Revocar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
