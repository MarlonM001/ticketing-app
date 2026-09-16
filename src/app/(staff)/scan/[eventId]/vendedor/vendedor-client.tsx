"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registerGuest } from "./actions";
import { isActionError } from "@/lib/action-result";

type TicketType = { id: string; name: string; price_cents: number };

export default function VendedorClient({
  eventId,
  ticketTypes,
}: {
  eventId: string;
  ticketTypes: TicketType[];
}) {
  const router = useRouter();
  const [ticketTypeId, setTicketTypeId] = useState(ticketTypes[0]?.id ?? "");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (ticketTypes.length === 0) {
    return (
      <p className="text-neutral-400">
        Todavía no hay tipos de entrada activos para este evento. Pedile al organizador que
        cree uno.
      </p>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !ticketTypeId) return;
    setError(null);
    startTransition(async () => {
      const res = await registerGuest(eventId, { ticketTypeId, name, phone });
      if (isActionError(res)) {
        setError(res.error);
        return;
      }
      router.push(`/scan/${eventId}/vendedor/${res.ticketId}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div className="space-y-1">
        <label className="text-sm text-neutral-400">Tipo de entrada</label>
        <select
          value={ticketTypeId}
          onChange={(e) => setTicketTypeId(e.target.value)}
          required
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2"
        >
          {ticketTypes.map((tt) => (
            <option key={tt.id} value={tt.id}>
              {tt.name} — ${(tt.price_cents / 100).toLocaleString("es-AR")}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-neutral-400">Nombre y apellido</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-neutral-400">WhatsApp del cliente</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          placeholder="Ej: 5491122334455"
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-lime-500 px-3 py-2 font-medium text-neutral-950 disabled:opacity-50"
      >
        {isPending ? "Registrando..." : "Registrar y generar QR"}
      </button>
    </form>
  );
}
