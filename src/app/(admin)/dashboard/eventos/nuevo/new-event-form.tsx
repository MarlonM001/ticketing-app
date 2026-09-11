"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createEvent } from "../actions";

type TicketTypeRow = { name: string; price: string; isStaff: boolean };

const DEFAULT_TYPES: TicketTypeRow[] = [
  { name: "General", price: "0", isStaff: false },
  { name: "VIP", price: "0", isStaff: false },
  { name: "Invitado", price: "0", isStaff: false },
  { name: "Staff", price: "0", isStaff: true },
];

const DEFAULT_TEMPLATE =
  "Hola! Soy {{nombre}}, quiero confirmar mi entrada {{tipo}} para {{evento}}.";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function NewEventForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [venue, setVenue] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [types, setTypes] = useState<TicketTypeRow[]>(DEFAULT_TYPES);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateType(index: number, patch: Partial<TicketTypeRow>) {
    setTypes((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const { eventId } = await createEvent({
          name,
          slug,
          venue,
          starts_at: startsAt ? new Date(startsAt).toISOString() : undefined,
          whatsapp_number: whatsappNumber,
          whatsapp_message_template: template,
          ticket_types: types
            .filter((t) => t.name.trim())
            .map((t) => ({
              name: t.name.trim(),
              price_cents: Math.round(parseFloat(t.price || "0") * 100),
              is_staff_type: t.isStaff,
            })),
        });
        router.push(`/dashboard/${eventId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm text-neutral-400">Nombre del evento</label>
          <input
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-neutral-400">URL (slug)</label>
          <input
            required
            value={slug}
            onChange={(e) => {
              setSlug(slugify(e.target.value));
              setSlugTouched(true);
            }}
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-neutral-400">Lugar</label>
          <input
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-neutral-400">Fecha y hora</label>
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-neutral-400">WhatsApp (con código de país, ej: 5493511234567)</label>
          <input
            required
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-neutral-400">
          Mensaje prellenado de WhatsApp (variables: {"{{nombre}}"}, {"{{evento}}"}, {"{{tipo}}"})
        </label>
        <textarea
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm text-neutral-400">Tipos de entrada</label>
          <button
            type="button"
            onClick={() => setTypes((prev) => [...prev, { name: "", price: "0", isStaff: false }])}
            className="text-sm text-lime-400"
          >
            + Agregar tipo
          </button>
        </div>
        {types.map((t, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              placeholder="Nombre"
              value={t.name}
              onChange={(e) => updateType(i, { name: e.target.value })}
              className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2"
            />
            <input
              placeholder="Precio ($)"
              type="number"
              min="0"
              step="0.01"
              value={t.price}
              onChange={(e) => updateType(i, { price: e.target.value })}
              className="w-32 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2"
            />
            <label className="flex items-center gap-1 text-sm text-neutral-400">
              <input
                type="checkbox"
                checked={t.isStaff}
                onChange={(e) => updateType(i, { isStaff: e.target.checked })}
              />
              Staff
            </label>
            <button
              type="button"
              onClick={() => setTypes((prev) => prev.filter((_, idx) => idx !== i))}
              className="text-sm text-red-400"
            >
              Quitar
            </button>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-lime-500 px-4 py-2 font-medium text-neutral-950 disabled:opacity-50"
      >
        {isPending ? "Creando..." : "Crear evento"}
      </button>
    </form>
  );
}
