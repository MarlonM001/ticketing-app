"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { scanTicket, raiseAlert, type ScanResult } from "./actions";
import OrderPanel from "../../order-panel";
import CreditBanner from "../../credit-banner";
import RoleIcon from "@/components/role-icon";

type Product = { id: string; name: string; price_cents: number; stock_quantity: number | null };

const STATE_STYLES: Record<ScanResult["result"], { label: string; className: string }> = {
  ok: { label: "OK — INGRESAR", className: "bg-lime-600 border-lime-400" },
  already_used: { label: "YA USADO", className: "bg-red-700 border-red-400" },
  pending: { label: "PENDIENTE DE APROBACIÓN", className: "bg-amber-600 border-amber-400" },
  invalid: { label: "QR INVÁLIDO", className: "bg-neutral-700 border-neutral-500" },
};

export default function Scanner({
  products,
  creditCents,
  creditMessage,
}: {
  products: Product[];
  creditCents: number;
  creditMessage: string | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerInstance = useRef<import("html5-qrcode").Html5QrcodeScanner | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [alertSent, setAlertSent] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [isAlerting, startAlertTransition] = useTransition();
  const busyRef = useRef(false);

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

  useEffect(() => {
    if (result) return; // no re-render scanner while showing a result

    let cancelled = false;

    import("html5-qrcode").then(({ Html5QrcodeScanner }) => {
      if (cancelled || !containerRef.current) return;

      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: 250 },
        false,
      );
      scannerInstance.current = scanner;

      scanner.render(
        async (decodedText) => {
          if (busyRef.current) return;
          busyRef.current = true;
          try {
            await scanner.clear();
          } catch {
            // no-op
          }
          try {
            const res = await scanTicket(decodedText);
            setResult(res);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Error al escanear");
          } finally {
            busyRef.current = false;
          }
        },
        () => {
          // errores de decodificación frame a frame: se ignoran (es normal
          // mientras la cámara no encuentra un QR en foco)
        },
      );
    });

    return () => {
      cancelled = true;
      scannerInstance.current?.clear().catch(() => {});
    };
  }, [result]);

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

  if (error) {
    return (
      <div className="p-6 text-center text-red-400">
        {error}
        <button
          onClick={() => {
            setError(null);
            setResult(null);
          }}
          className="mt-4 block w-full rounded-md border border-neutral-700 px-3 py-2 text-white"
        >
          Reintentar
        </button>
        {floatingButtons}
      </div>
    );
  }

  if (result) {
    const style = STATE_STYLES[result.result];
    return (
      <div className={`flex min-h-screen flex-col items-center justify-center gap-4 border-8 p-6 text-center text-white ${style.className}`}>
        <p className="text-3xl font-black">{style.label}</p>
        {result.guest_name && <p className="text-xl">{result.guest_name}</p>}
        {result.ticket_type_name && <p className="text-neutral-200">{result.ticket_type_name}</p>}
        {result.scanned_at && (
          <p className="text-sm text-neutral-200">
            {result.result === "already_used" ? "Primer ingreso: " : "Ingresó a las "}
            {new Date(result.scanned_at).toLocaleTimeString("es-AR")}
          </p>
        )}
        <button
          onClick={() => setResult(null)}
          className="mt-4 rounded-md bg-white px-6 py-3 font-medium text-neutral-950"
        >
          Escanear siguiente
        </button>
        {floatingButtons}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-4 text-white">
      <p className="mb-3 flex items-center gap-1.5 text-sm text-neutral-400">
        <RoleIcon role="puerta" className="h-4 w-4 text-lime-400" />
        Puerta
      </p>
      <CreditBanner creditCents={creditCents} creditMessage={creditMessage} />
      <div id="qr-reader" ref={containerRef} />
      {floatingButtons}
    </div>
  );
}
