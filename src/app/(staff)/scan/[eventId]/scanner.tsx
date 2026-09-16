"use client";

import { useState, useTransition } from "react";
import { scanTicket, raiseAlert } from "./actions";
import OrderPanel from "../../order-panel";
import CreditBanner from "../../credit-banner";
import RoleIcon from "@/components/role-icon";
import QrScanner from "@/components/qr-scanner";

type Product = { id: string; name: string; price_cents: number; stock_quantity: number | null };

export default function Scanner({
  products,
  creditCents,
  creditMessage,
}: {
  products: Product[];
  creditCents: number;
  creditMessage: string | null;
}) {
  const [alertSent, setAlertSent] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [isAlerting, startAlertTransition] = useTransition();

  function sendAlert() {
    startAlertTransition(async () => {
      try {
        await raiseAlert();
        setAlertSent(true);
        setTimeout(() => setAlertSent(false), 3000);
      } catch {
        // no-op: el botón de alerta no debe bloquear el escaneo
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

  const floatingButtons = (
    <>
      <button
        onClick={() => setOrderOpen(true)}
        className="fixed bottom-4 left-4 z-10 rounded-full bg-neutral-800 px-4 py-3 text-sm font-bold text-white shadow-lg"
      >
        🍺 Pedir algo
      </button>
      <button
        onClick={sendAlert}
        disabled={isAlerting}
        className="fixed bottom-4 right-4 z-10 rounded-full bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-lg disabled:opacity-50"
      >
        {alertSent ? "Alerta enviada ✓" : "🚨 Alertar"}
      </button>
    </>
  );

  return (
    <QrScanner
      onScan={scanTicket}
      floatingButtons={floatingButtons}
      header={
        <>
          <p className="mb-3 flex items-center gap-1.5 text-sm text-neutral-400">
            <RoleIcon role="puerta" className="h-4 w-4 text-lime-400" />
            Puerta
          </p>
          <CreditBanner creditCents={creditCents} creditMessage={creditMessage} />
        </>
      }
    />
  );
}
