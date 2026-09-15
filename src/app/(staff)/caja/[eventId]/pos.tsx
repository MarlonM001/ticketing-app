"use client";

import { useState, useTransition } from "react";
import { sellProduct } from "./actions";
import OrderPanel from "../../order-panel";
import CreditBanner from "../../credit-banner";
import RoleIcon from "@/components/role-icon";
import { resolveNotification, type StaffNotification } from "../../actions";

type Product = { id: string; name: string; price_cents: number; stock_quantity: number | null };
type StaffAccount = { id: string; username: string; role: string };

const ROLE_LABEL: Record<string, string> = {
  puerta: "Puerta",
  caja: "Caja",
  mesero: "Mesero",
  dj: "DJ",
};

export default function Pos({
  label,
  products,
  staffAccounts,
  notifications,
  creditCents,
  creditMessage,
}: {
  label: string;
  products: Product[];
  staffAccounts: StaffAccount[];
  notifications: StaffNotification[];
  creditCents: number;
  creditMessage: string | null;
}) {
  const [stockById, setStockById] = useState<Record<string, number | null>>(
    Object.fromEntries(products.map((p) => [p.id, p.stock_quantity])),
  );
  const [sessionTotalCents, setSessionTotalCents] = useState(0);
  const [chargeTo, setChargeTo] = useState("");
  const [orderOpen, setOrderOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  function dismiss(id: string) {
    setDismissedIds((prev) => [...prev, id]);
    startTransition(() => resolveNotification(id));
  }

  const visibleNotifications = notifications.filter((n) => !dismissedIds.includes(n.id));

  function sell(product: Product) {
    const stock = stockById[product.id];
    if (stock !== null && stock !== undefined && stock <= 0) return;

    const staffAccount = staffAccounts.find((a) => a.id === chargeTo);

    setPendingId(product.id);
    startTransition(async () => {
      try {
        const res = await sellProduct(product.id, 1, staffAccount?.id);
        if (res.result === "ok") {
          setStockById((prev) => ({ ...prev, [product.id]: res.remaining_stock }));
          if (!staffAccount) setSessionTotalCents((prev) => prev + product.price_cents);
          setMessage(
            staffAccount
              ? `✔ ${product.name} cargado a ${staffAccount.username}`
              : `✔ ${product.name} vendido`,
          );
        } else if (res.result === "out_of_stock") {
          setStockById((prev) => ({ ...prev, [product.id]: res.remaining_stock ?? 0 }));
          setMessage(`Sin stock de ${res.product_name ?? product.name}`);
        } else {
          setMessage("No se pudo registrar la venta");
        }
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Error al vender");
      } finally {
        setPendingId(null);
        setTimeout(() => setMessage(null), 2000);
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
    <div className="min-h-screen bg-neutral-950 p-4 pb-24 text-white">
      <div className="mb-4 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm text-neutral-400">
          <RoleIcon role="caja" className="h-4 w-4 text-lime-400" />
          Caja · {label}
        </p>
        <p className="text-lg font-semibold">
          ${(sessionTotalCents / 100).toLocaleString("es-AR")}
        </p>
      </div>

      <CreditBanner creditCents={creditCents} creditMessage={creditMessage} />

      <button
        onClick={() => setOrderOpen(true)}
        className="mb-4 w-full rounded-md border border-neutral-700 px-3 py-2 text-sm"
      >
        🍺 Pedir algo para mí (se descuenta de mi sueldo)
      </button>

      {visibleNotifications.length > 0 && (
        <div className="mb-4 space-y-2">
          {visibleNotifications.map((n) => (
            <div
              key={n.id}
              className="flex items-center justify-between gap-2 rounded-md border border-amber-600 bg-amber-950/30 p-3 text-sm"
            >
              <div>
                <p className="font-medium text-amber-300">{n.label}</p>
                <p className="text-neutral-300">{n.reason}</p>
              </div>
              <button
                onClick={() => dismiss(n.id)}
                className="shrink-0 rounded-md border border-neutral-700 px-2 py-1 text-xs"
              >
                Listo
              </button>
            </div>
          ))}
        </div>
      )}

      {staffAccounts.length > 0 && (
        <div className="mb-4 space-y-1">
          <label className="text-xs text-neutral-500">Cobrar a</label>
          <select
            value={chargeTo}
            onChange={(e) => setChargeTo(e.target.value)}
            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm"
          >
            <option value="">Efectivo</option>
            {staffAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.username} · {ROLE_LABEL[a.role] ?? a.role} (descuenta de su sueldo)
              </option>
            ))}
          </select>
        </div>
      )}

      {message && (
        <div className="mb-4 rounded-md border border-neutral-700 bg-neutral-900 p-2 text-center text-sm">
          {message}
        </div>
      )}

      {products.length === 0 ? (
        <p className="text-neutral-400">No hay productos activos para este evento.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {products.map((p) => {
            const stock = stockById[p.id];
            const outOfStock = stock !== null && stock !== undefined && stock <= 0;
            const lowStock = stock !== null && stock !== undefined && stock > 0 && stock <= 5;

            return (
              <button
                key={p.id}
                disabled={outOfStock || (isPending && pendingId === p.id)}
                onClick={() => sell(p)}
                className={`rounded-xl border p-4 text-left disabled:opacity-40 ${
                  outOfStock
                    ? "border-red-800 bg-red-950/40"
                    : lowStock
                      ? "border-amber-600 bg-amber-950/30"
                      : "border-neutral-800 bg-neutral-900"
                }`}
              >
                <p className="text-lg font-semibold">{p.name}</p>
                <p className="text-neutral-400">
                  ${(p.price_cents / 100).toLocaleString("es-AR")}
                </p>
                <p
                  className={`mt-1 text-xs ${
                    outOfStock ? "text-red-400" : lowStock ? "text-amber-400" : "text-neutral-600"
                  }`}
                >
                  {stock === null || stock === undefined
                    ? "sin límite"
                    : outOfStock
                      ? "agotado"
                      : `stock: ${stock}`}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
