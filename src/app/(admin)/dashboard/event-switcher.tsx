"use client";

import { useRouter, useParams } from "next/navigation";

type EventOption = { id: string; name: string };

export default function EventSwitcher({ events }: { events: EventOption[] }) {
  const router = useRouter();
  const params = useParams<{ eventId?: string }>();

  return (
    <select
      value={params.eventId ?? ""}
      onChange={(e) => {
        if (e.target.value) router.push(`/dashboard/${e.target.value}`);
      }}
      className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm"
    >
      <option value="" disabled>
        Seleccionar evento
      </option>
      {events.map((event) => (
        <option key={event.id} value={event.id}>
          {event.name}
        </option>
      ))}
    </select>
  );
}
