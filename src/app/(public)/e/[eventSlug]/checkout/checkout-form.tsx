"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTicket } from "./actions";
import { isActionError } from "@/lib/action-result";

type Step = "detalles" | "confirmar";

export default function CheckoutForm({
  eventSlug,
  ticketTypeId,
  ticketTypeName,
  priceCents,
  refCode,
}: {
  eventSlug: string;
  ticketTypeId: string;
  ticketTypeName: string;
  priceCents: number;
  refCode?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("detalles");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const priceLabel =
    priceCents === 0 ? "Gratis" : `$${(priceCents / 100).toLocaleString("es-AR")}`;

  function goToConfirm(e: React.FormEvent) {
    e.preventDefault();
    setStep("confirmar");
  }

  function confirm() {
    setError(null);
    startTransition(async () => {
      const res = await createTicket({
        ticketTypeId,
        refCode,
        name,
        phone,
      });
      if (isActionError(res)) {
        setError(res.error);
        return;
      }
      router.push(`/e/${eventSlug}/confirmacion/${res.ticketId}`);
    });
  }

  return (
    <div className="mx-auto min-h-screen max-w-md bg-neutral-950 px-4 py-8 text-white">
      <div className="mb-6 flex gap-2 text-xs text-neutral-500">
        <span className={step === "detalles" ? "text-lime-400" : ""}>1. Detalles</span>
        <span>→</span>
        <span className={step === "confirmar" ? "text-lime-400" : ""}>2. Confirmar</span>
      </div>

      <div className="mb-6 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
        <p className="font-medium">{ticketTypeName}</p>
        <p className="text-neutral-400">{priceLabel}</p>
      </div>

      {step === "detalles" && (
        <form onSubmit={goToConfirm} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-neutral-400">Nombre y apellido</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-neutral-400">Teléfono</label>
            <input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-lime-500 px-3 py-2 font-medium text-neutral-950"
          >
            Continuar
          </button>
        </form>
      )}

      {step === "confirmar" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-sm">
            <p>
              <span className="text-neutral-500">Nombre: </span>
              {name}
            </p>
            <p>
              <span className="text-neutral-500">Teléfono: </span>
              {phone}
            </p>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep("detalles")}
              className="flex-1 rounded-md border border-neutral-700 px-3 py-2"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={isPending}
              className="flex-1 rounded-md bg-lime-500 px-3 py-2 font-medium text-neutral-950 disabled:opacity-50"
            >
              {isPending ? "Procesando..." : "Confirmar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
