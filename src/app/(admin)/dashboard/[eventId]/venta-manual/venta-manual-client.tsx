"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createManualSale } from "./actions";
import { isActionError } from "@/lib/action-result";

type TicketType = { id: string; name: string; price_cents: number };

export default function VentaManualClient({
  eventId,
  ticketTypes,
}: {
  eventId: string;
  ticketTypes: TicketType[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (ticketTypes.length === 0) {
    return (
      <p className="text-neutral-400">
        Primero creá al menos un tipo de entrada activo para este evento.
      </p>
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createManualSale(eventId, formData);
      if (isActionError(res)) {
        setError(res.error);
        return;
      }
      router.push(`/dashboard/${eventId}/venta-manual/${res.ticketId}`);
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div className="space-y-1">
        <label className="text-sm text-neutral-400">Tipo de entrada</label>
        <select
          name="ticketTypeId"
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
          name="name"
          required
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-neutral-400">WhatsApp del cliente</label>
        <input
          name="phone"
          required
          placeholder="Ej: 5491122334455"
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-neutral-400">
          Foto de respaldo (factura o foto del efectivo, opcional)
        </label>
        <input
          name="proof"
          type="file"
          accept="image/*"
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-lime-500 px-3 py-2 font-medium text-neutral-950 disabled:opacity-50"
      >
        {isPending ? "Registrando..." : "Registrar venta"}
      </button>
    </form>
  );
}
