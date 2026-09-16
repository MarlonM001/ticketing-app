"use client";

import { useState, useTransition } from "react";
import { sellProductAsAdmin } from "./actions";
import { isActionError } from "@/lib/action-result";

type Product = { id: string; name: string; price_cents: number; stock_quantity: number | null };

export default function VenderClient({
  eventId,
  products,
}: {
  eventId: string;
  products: Product[];
}) {
  const [stockById, setStockById] = useState<Record<string, number | null>>(
    Object.fromEntries(products.map((p) => [p.id, p.stock_quantity])),
  );
  const [sessionTotalCents, setSessionTotalCents] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  function sell(product: Product) {
    const stock = stockById[product.id];
    if (stock !== null && stock !== undefined && stock <= 0) return;

    setPendingId(product.id);
    startTransition(async () => {
      const res = await sellProductAsAdmin(eventId, product.id, 1);
      if (isActionError(res)) {
        setMessage(res.error);
      } else if (res.result === "ok") {
        setStockById((prev) => ({ ...prev, [product.id]: res.remaining_stock }));
        setSessionTotalCents((prev) => prev + product.price_cents);
        setMessage(`✔ ${product.name} vendido`);
      } else if (res.result === "out_of_stock") {
        setStockById((prev) => ({ ...prev, [product.id]: res.remaining_stock ?? 0 }));
        setMessage(`Sin stock de ${res.product_name ?? product.name}`);
      } else {
        setMessage("No se pudo registrar la venta");
      }
      setPendingId(null);
      setTimeout(() => setMessage(null), 2000);
    });
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-4 flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <span className="text-sm text-neutral-400">Total de esta sesión</span>
        <span className="text-lg font-semibold">
          ${(sessionTotalCents / 100).toLocaleString("es-AR")}
        </span>
      </div>

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
