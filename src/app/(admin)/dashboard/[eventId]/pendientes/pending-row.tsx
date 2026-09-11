"use client";

import { useTransition } from "react";
import { approveTicket, rejectTicket } from "./actions";

type PendingTicket = {
  ticket_id: string;
  event_id: string;
  ticket_type_name: string;
  guest_name: string;
  guest_phone: string | null;
  price_cents: number;
  createdAtLabel: string;
};

export default function PendingRow({ ticket }: { ticket: PendingTicket }) {
  const [isPending, startTransition] = useTransition();

  return (
    <tr className="border-b border-neutral-800">
      <td className="py-2 pr-4">{ticket.guest_name}</td>
      <td className="py-2 pr-4 text-neutral-400">{ticket.guest_phone}</td>
      <td className="py-2 pr-4">{ticket.ticket_type_name}</td>
      <td className="py-2 pr-4">${(ticket.price_cents / 100).toLocaleString("es-AR")}</td>
      <td className="py-2 pr-4 text-neutral-500">{ticket.createdAtLabel}</td>
      <td className="flex gap-2 py-2">
        <button
          disabled={isPending}
          onClick={() => startTransition(() => approveTicket(ticket.ticket_id, ticket.event_id))}
          className="rounded-md bg-lime-500 px-3 py-1 text-sm font-medium text-neutral-950 disabled:opacity-50"
        >
          Aprobar
        </button>
        <button
          disabled={isPending}
          onClick={() => startTransition(() => rejectTicket(ticket.ticket_id, ticket.event_id))}
          className="rounded-md border border-red-500 px-3 py-1 text-sm text-red-400 disabled:opacity-50"
        >
          Rechazar
        </button>
      </td>
    </tr>
  );
}
