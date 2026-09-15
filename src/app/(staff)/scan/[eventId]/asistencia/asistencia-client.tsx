"use client";

import { useState, useTransition } from "react";
import OrderPanel from "../../../order-panel";
import CreditBanner from "../../../credit-banner";
import RoleIcon from "@/components/role-icon";
import { notifyRole } from "../../../actions";
import type { StaffRole } from "@/lib/staff-session";

type Product = { id: string; name: string; price_cents: number; stock_quantity: number | null };

const ROLE_LABEL: Record<string, string> = {
  mesero: "Mesero",
  dj: "DJ",
};

export default function AsistenciaClient({
  label,
  role,
  products,
  creditCents,
  creditMessage,
}: {
  label: string;
  role: StaffRole;
  products: Product[];
  creditCents: number;
  creditMessage: string | null;
}) {
  const [orderOpen, setOrderOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyMessage, setNotifyMessage] = useState("");
  const [notifyStatus, setNotifyStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function sendNotify() {
    if (!notifyMessage.trim()) return;
    startTransition(async () => {
      try {
        await notifyRole("caja", notifyMessage.trim());
        setNotifyStatus("Enviado ✓");
        setNotifyMessage("");
        setNotifyOpen(false);
      } catch (err) {
        setNotifyStatus(err instanceof Error ? err.message : "No se pudo enviar");
      } finally {
        setTimeout(() => setNotifyStatus(null), 2500);
      }
    });
  }

  if (orderOpen) {
    return (
      <OrderPanel
        products={products}
        creditCents={creditCents}
        creditMessage={creditMessage}
        onClose={() => setOrderOpen(false)}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-neutral-950 px-4 text-center text-white">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-lime-500/30 bg-lime-500/10 text-lime-400">
        <RoleIcon role={role} className="h-6 w-6" />
      </div>
      <p className="text-xl font-semibold">Asistencia registrada</p>
      <p className="text-neutral-400">
        {label} · {ROLE_LABEL[role] ?? role}
      </p>

      <div className="w-full max-w-xs">
        <CreditBanner creditCents={creditCents} creditMessage={creditMessage} />
      </div>

      <button
        onClick={() => setOrderOpen(true)}
        className="mt-4 w-full max-w-xs rounded-md border border-neutral-700 px-4 py-3 text-sm"
      >
        🍺 Pedir algo para mí (se descuenta de mi sueldo)
      </button>

      {role === "dj" && (
        <div className="w-full max-w-xs">
          {notifyOpen ? (
            <div className="space-y-2 rounded-md border border-neutral-700 bg-neutral-900 p-3 text-left">
              <label className="text-xs text-neutral-500">Mensaje para Caja</label>
              <input
                value={notifyMessage}
                onChange={(e) => setNotifyMessage(e.target.value)}
                placeholder="Ej: necesito hielo en la cabina"
                className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
              />
              <button
                onClick={sendNotify}
                disabled={isPending}
                className="w-full rounded-md bg-lime-500 px-3 py-2 text-sm font-medium text-neutral-950 disabled:opacity-50"
              >
                Enviar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setNotifyOpen(true)}
              className="w-full rounded-md border border-neutral-700 px-4 py-3 text-sm"
            >
              📢 Avisar a Caja
            </button>
          )}
        </div>
      )}

      {notifyStatus && <p className="text-sm text-lime-400">{notifyStatus}</p>}
    </div>
  );
}
