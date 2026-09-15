"use client";

import { useMemo, useState, useTransition } from "react";
import { updateTicket, cancelTicket, reinstateTicket } from "./actions";

type TicketRow = {
  id: string;
  status: "pending" | "approved" | "rejected";
  priceCents: number;
  createdAtLabel: string;
  ticketTypeId: string;
  ticketTypeName: string;
  guestName: string;
  guestPhone: string;
};

type TicketType = { id: string; name: string };

const STATUS_LABEL: Record<TicketRow["status"], string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Cancelado",
};

export default function InvitadosClient({
  eventId,
  rows,
  ticketTypes,
}: {
  eventId: string;
  rows: TicketRow[];
  ticketTypes: TicketType[];
}) {
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (!typeFilter || r.ticketTypeId === typeFilter) &&
          (!statusFilter || r.status === statusFilter),
      ),
    [rows, typeFilter, statusFilter],
  );

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex gap-2 text-sm">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2"
        >
          <option value="">Todos los tipos</option>
          {ticketTypes.map((tt) => (
            <option key={tt.id} value={tt.id}>
              {tt.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2"
        >
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="approved">Aprobado</option>
          <option value="rejected">Cancelado</option>
        </select>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-neutral-400">No hay invitados que coincidan con el filtro.</p>
        ) : (
          filtered.map((t) =>
            editingId === t.id ? (
              <EditRow
                key={t.id}
                ticket={t}
                ticketTypes={ticketTypes}
                onCancel={() => setEditingId(null)}
                onSave={(input) =>
                  startTransition(async () => {
                    await updateTicket(t.id, eventId, input);
                    setEditingId(null);
                  })
                }
              />
            ) : (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 p-3"
              >
                <div>
                  <p className="font-medium">{t.guestName}</p>
                  <p className="text-sm text-neutral-400">
                    {t.guestPhone} · {t.ticketTypeName} · $
                    {(t.priceCents / 100).toLocaleString("es-AR")}
                  </p>
                  <p className="text-xs text-neutral-600">
                    {STATUS_LABEL[t.status]} · {t.createdAtLabel}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => setEditingId(t.id)}
                    className="rounded-md border border-neutral-700 px-3 py-1 text-sm"
                  >
                    Editar
                  </button>
                  {t.status === "rejected" ? (
                    <button
                      disabled={isPending}
                      onClick={() => startTransition(() => reinstateTicket(t.id, eventId))}
                      className="rounded-md border border-lime-500 px-3 py-1 text-sm text-lime-400 disabled:opacity-50"
                    >
                      Reactivar
                    </button>
                  ) : (
                    <button
                      disabled={isPending}
                      onClick={() => startTransition(() => cancelTicket(t.id, eventId))}
                      className="rounded-md border border-red-500 px-3 py-1 text-sm text-red-400 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            ),
          )
        )}
      </div>
    </div>
  );
}

function EditRow({
  ticket,
  ticketTypes,
  onSave,
  onCancel,
}: {
  ticket: TicketRow;
  ticketTypes: TicketType[];
  onSave: (input: { guestName: string; guestPhone: string; ticketTypeId: string }) => void;
  onCancel: () => void;
}) {
  const [guestName, setGuestName] = useState(ticket.guestName);
  const [guestPhone, setGuestPhone] = useState(ticket.guestPhone);
  const [ticketTypeId, setTicketTypeId] = useState(ticket.ticketTypeId);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-lime-700 bg-neutral-900 p-3">
      <input
        value={guestName}
        onChange={(e) => setGuestName(e.target.value)}
        className="flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2"
      />
      <input
        value={guestPhone}
        onChange={(e) => setGuestPhone(e.target.value)}
        className="w-40 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2"
      />
      <select
        value={ticketTypeId}
        onChange={(e) => setTicketTypeId(e.target.value)}
        className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2"
      >
        {ticketTypes.map((tt) => (
          <option key={tt.id} value={tt.id}>
            {tt.name}
          </option>
        ))}
      </select>
      <button
        onClick={() => onSave({ guestName: guestName.trim(), guestPhone: guestPhone.trim(), ticketTypeId })}
        className="rounded-md bg-lime-500 px-3 py-1 text-sm font-medium text-neutral-950"
      >
        Guardar
      </button>
      <button onClick={onCancel} className="rounded-md border border-neutral-700 px-3 py-1 text-sm">
        Cancelar
      </button>
    </div>
  );
}
