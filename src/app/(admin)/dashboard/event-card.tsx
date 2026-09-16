"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteEvent } from "./eventos/actions";
import { isActionError } from "@/lib/action-result";

type Event = { id: string; name: string; venue: string | null; status: string };

export default function EventCard({ event }: { event: Event }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const res = await deleteEvent(event.id);
      if (isActionError(res)) {
        setError(res.error);
        setConfirming(false);
      }
    });
  }

  return (
    <div className="relative rounded-xl border border-neutral-800 bg-neutral-900 p-4 hover:border-lime-500">
      <Link href={`/dashboard/${event.id}`} className="block pr-16">
        <p className="font-semibold">{event.name}</p>
        <p className="text-sm text-neutral-400">{event.venue}</p>
        <p className="mt-2 text-xs uppercase text-neutral-500">{event.status}</p>
      </Link>

      {confirming ? (
        <div className="absolute right-2 top-2 flex gap-1">
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-md bg-red-600 px-2 py-1 text-xs text-white disabled:opacity-50"
          >
            {isPending ? "..." : "Confirmar"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="rounded-md border border-neutral-700 px-2 py-1 text-xs"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="absolute right-2 top-2 rounded-md border border-neutral-700 px-2 py-1 text-xs text-red-400"
        >
          Eliminar
        </button>
      )}

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
