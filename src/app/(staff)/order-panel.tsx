"use client";

import { useState, useTransition } from "react";
import { orderForSelf } from "./actions";
import { isActionError } from "@/lib/action-result";

type Product = { id: string; name: string; price_cents: number; stock_quantity: number | null };

export default function OrderPanel({
  products,
  creditCents = 0,
  creditMessage,
  onClose,
}: {
  products: Product[];
  creditCents?: number;
  creditMessage?: string | null;
  onClose: () => void;
}) {
  const [stockById, setStockById] = useState<Record<string, number | null>>(
    Object.fromEntries(products.map((p) => [p.id, p.stock_quantity])),
  );
  const [credit, setCredit] = useState(creditCents);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  function order(product: Product) {
    const stock = stockById[product.id];
    if (stock !== null && stock !== undefined && stock <= 0) return;

    setPendingId(product.id);
    startTransition(async () => {
      const res = await orderForSelf(product.id);
      if (isActionError(res)) {
        setMessage(res.error);
      } else if (res.result === "ok") {
        setStockById((prev) => ({ ...prev, [product.id]: res.remaining_stock }));
        if (res.used_credit) {
          setCredit((prev) => Math.max(0, prev - product.price_cents));
          setMessage(`🎁 Pediste ${product.name} — de cortesía, no te descuenta nada`);
        } else {
          setMessage(`✔ Pediste ${product.name} — se descuenta de tu sueldo`);
        }
      } else if (res.result === "out_of_stock") {
        setStockById((prev) => ({ ...prev, [product.id]: res.remaining_stock ?? 0 }));
        setMessage(`Sin stock de ${res.product_name ?? product.name}`);
      } else {
        setMessage("No se pudo registrar el pedido");
      }
      setPendingId(null);
      setTimeout(() => setMessage(null), 2000);
    });
  }

  return (
    <div className="fixed inset-0 z-20 flex flex-col bg-neutral-950 p-4 text-white">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-lg font-semibold">Pedir algo</p>
        <button
          onClick={onClose}
          className="rounded-md border border-neutral-700 px-3 py-1 text-sm"
        >
          Cerrar
        </button>
      </div>

      {credit > 0 && (
        <div className="mb-4 rounded-md border border-lime-600 bg-lime-950/30 p-3 text-sm">
          <p className="font-semibold text-lime-300">
            🎁 Tenés ${(credit / 100).toLocaleString("es-AR")} de cortesía del organizador
          </p>
          {creditMessage && <p className="mt-1 text-neutral-300">{creditMessage}</p>}
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
        <div className="grid grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
          {products.map((p) => {
            const stock = stockById[p.id];
            const outOfStock = stock !== null && stock !== undefined && stock <= 0;
            const lowStock = stock !== null && stock !== undefined && stock > 0 && stock <= 5;

            return (
              <button
                key={p.id}
                disabled={outOfStock || (isPending && pendingId === p.id)}
                onClick={() => order(p)}
                className={`rounded-xl border p-4 text-left disabled:opacity-40 ${
                  outOfStock
                    ? "border-red-800 bg-red-950/40"
                    : lowStock
                      ? "border-amber-600 bg-amber-950/30"
                      : "border-neutral-800 bg-neutral-900"
                }`}
              >
                <p className="text-lg font-semibold">{p.name}</p>
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
