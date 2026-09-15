"use client";

import { useState, useTransition } from "react";
import { createProduct, updateProduct, deleteProduct, setProductActive } from "./actions";

type ProductRow = {
  id: string;
  name: string;
  price_cents: number;
  stock_quantity: number | null;
  active: boolean;
};

export default function ProductosClient({
  eventId,
  initialProducts,
}: {
  eventId: string;
  initialProducts: ProductRow[];
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="max-w-3xl space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim() || !price.trim()) return;
          startTransition(async () => {
            await createProduct(eventId, {
              name: name.trim(),
              priceCents: Math.round(parseFloat(price) * 100),
              stockQuantity: stock.trim() ? parseInt(stock, 10) : null,
            });
            setName("");
            setPrice("");
            setStock("");
          });
        }}
        className="flex gap-2"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Cerveza"
          className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2"
        />
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          type="number"
          min="0"
          step="0.01"
          placeholder="Precio"
          className="w-28 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2"
        />
        <input
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          type="number"
          min="0"
          placeholder="Stock (opcional)"
          className="w-36 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-lime-500 px-4 py-2 font-medium text-neutral-950 disabled:opacity-50"
        >
          Agregar
        </button>
      </form>

      <div className="space-y-2">
        {initialProducts.map((p) =>
          editingId === p.id ? (
            <EditRow
              key={p.id}
              product={p}
              onCancel={() => setEditingId(null)}
              onSave={(input) =>
                startTransition(async () => {
                  await updateProduct(p.id, eventId, input);
                  setEditingId(null);
                })
              }
            />
          ) : (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 p-3"
            >
              <div>
                <p className="font-medium">
                  {p.name}{" "}
                  {!p.active && <span className="text-xs text-red-400">(inactivo)</span>}
                </p>
                <p className="text-sm text-neutral-400">
                  ${(p.price_cents / 100).toLocaleString("es-AR")} ·{" "}
                  {p.stock_quantity === null ? "sin límite de stock" : `stock: ${p.stock_quantity}`}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => setEditingId(p.id)}
                  className="rounded-md border border-neutral-700 px-3 py-1 text-sm"
                >
                  Editar
                </button>
                {p.active ? (
                  <button
                    disabled={isPending}
                    onClick={() => startTransition(() => deleteProduct(p.id, eventId))}
                    className="rounded-md border border-red-500 px-3 py-1 text-sm text-red-400 disabled:opacity-50"
                  >
                    Eliminar
                  </button>
                ) : (
                  <button
                    disabled={isPending}
                    onClick={() => startTransition(() => setProductActive(p.id, eventId, true))}
                    className="rounded-md border border-lime-500 px-3 py-1 text-sm text-lime-400 disabled:opacity-50"
                  >
                    Reactivar
                  </button>
                )}
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function EditRow({
  product,
  onSave,
  onCancel,
}: {
  product: ProductRow;
  onSave: (input: { name: string; priceCents: number; stockQuantity: number | null }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(String(product.price_cents / 100));
  const [stock, setStock] = useState(
    product.stock_quantity === null ? "" : String(product.stock_quantity),
  );

  return (
    <div className="flex items-center gap-2 rounded-lg border border-lime-700 bg-neutral-900 p-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2"
      />
      <input
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        type="number"
        min="0"
        step="0.01"
        className="w-28 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2"
      />
      <input
        value={stock}
        onChange={(e) => setStock(e.target.value)}
        type="number"
        min="0"
        placeholder="Sin límite"
        className="w-32 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2"
      />
      <button
        onClick={() =>
          onSave({
            name: name.trim(),
            priceCents: Math.round(parseFloat(price) * 100),
            stockQuantity: stock.trim() ? parseInt(stock, 10) : null,
          })
        }
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
