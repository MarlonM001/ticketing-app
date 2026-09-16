"use client";

import { useMemo, useState } from "react";

type Row = {
  id: string;
  currentlyInside: boolean;
  ticketTypeName: string;
  guestName: string;
  guestPhone: string;
};

type Filter = "all" | "inside" | "outside";

export default function AsistenciaClient({ rows }: { rows: Row[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const insideCount = rows.filter((r) => r.currentlyInside).length;
  const outsideCount = rows.length - insideCount;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "inside" && !r.currentlyInside) return false;
      if (filter === "outside" && r.currentlyInside) return false;
      if (term && !r.guestName.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [rows, filter, search]);

  return (
    <div className="max-w-3xl space-y-4">
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
          <p className="text-2xl font-bold">{rows.length}</p>
          <p className="text-xs text-neutral-500">Total</p>
        </div>
        <div className="rounded-lg border border-lime-700 bg-lime-950/20 p-3">
          <p className="text-2xl font-bold text-lime-400">{insideCount}</p>
          <p className="text-xs text-neutral-500">Adentro</p>
        </div>
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-3">
          <p className="text-2xl font-bold text-neutral-400">{outsideCount}</p>
          <p className="text-xs text-neutral-500">Afuera</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "Todos"],
            ["inside", "Adentro"],
            ["outside", "Afuera"],
          ] as [Filter, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              filter === value
                ? "border-lime-500 bg-lime-500/10 text-lime-400"
                : "border-neutral-700 text-neutral-300"
            }`}
          >
            {label}
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre..."
          className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm"
        />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-neutral-400">No hay invitados que coincidan.</p>
        ) : (
          filtered.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 p-3"
            >
              <div>
                <p className="font-medium">{r.guestName}</p>
                <p className="text-sm text-neutral-400">
                  {r.guestPhone} · {r.ticketTypeName}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                  r.currentlyInside
                    ? "bg-lime-500/10 text-lime-400"
                    : "bg-neutral-800 text-neutral-400"
                }`}
              >
                {r.currentlyInside ? "Adentro" : "Afuera"}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
