"use client";

import { useState, useTransition } from "react";
import { createRrpp, toggleRrppActive } from "./actions";
import { isActionError } from "@/lib/action-result";

type RrppRow = {
  id: string;
  name: string;
  code: string;
  active: boolean;
  total_tickets: number;
  approved_tickets: number;
  used_tickets: number;
  revenue_cents: number;
  courtesy_count: number;
};

export default function RrppClient({
  eventId,
  eventSlug,
  rows,
}: {
  eventId: string;
  eventSlug: string;
  rows: RrppRow[];
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="max-w-3xl space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim() || !code.trim()) return;
          setError(null);
          startTransition(async () => {
            const res = await createRrpp(eventId, name.trim(), code.trim().toUpperCase());
            if (isActionError(res)) {
              setError(res.error);
              return;
            }
            setName("");
            setCode("");
          });
        }}
        className="flex gap-2"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del vendedor"
          className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2"
        />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Código (ej: JUAN10)"
          className="w-40 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-lime-500 px-4 py-2 font-medium text-neutral-950 disabled:opacity-50"
        >
          Agregar
        </button>
      </form>
      {error && <p className="text-sm text-red-400">{error}</p>}

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-700 text-neutral-500">
            <th className="pb-2">Vendedor</th>
            <th className="pb-2">Total</th>
            <th className="pb-2">Válidos</th>
            <th className="pb-2">Usados</th>
            <th className="pb-2">Cortesías</th>
            <th className="pb-2">Recaudación</th>
            <th className="pb-2">Link</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const link = `${origin}/e/${eventSlug}?ref=${r.code}`;
            return (
              <tr key={r.id} className="border-b border-neutral-800">
                <td className="py-2">
                  {r.name}
                  {!r.active && <span className="ml-2 text-xs text-red-400">inactivo</span>}
                </td>
                <td className="py-2">{r.total_tickets}</td>
                <td className="py-2">{r.approved_tickets}</td>
                <td className="py-2">{r.used_tickets}</td>
                <td className="py-2">{r.courtesy_count}</td>
                <td className="py-2">${(r.revenue_cents / 100).toLocaleString("es-AR")}</td>
                <td className="py-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(link);
                      setCopiedId(r.id);
                      setTimeout(() => setCopiedId(null), 1500);
                    }}
                    className="rounded-md border border-neutral-700 px-2 py-1 text-xs"
                  >
                    {copiedId === r.id ? "Copiado" : "Copiar link"}
                  </button>
                  <button
                    onClick={() =>
                      startTransition(() => {
                        void toggleRrppActive(r.id, eventId, !r.active);
                      })
                    }
                    className="ml-2 rounded-md border border-neutral-700 px-2 py-1 text-xs"
                  >
                    {r.active ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
