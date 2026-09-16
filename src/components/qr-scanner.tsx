"use client";

import { useEffect, useRef, useState } from "react";
import type { ScanResult } from "@/lib/scan-result";
import { isActionError, type ActionResult } from "@/lib/action-result";

export type { ScanResult };

const STATE_STYLES: Record<ScanResult["result"], { label: string; className: string }> = {
  ok_in: { label: "OK — INGRESA", className: "bg-lime-600 border-lime-400" },
  ok_out: { label: "OK — SALE", className: "bg-sky-600 border-sky-400" },
  pending: { label: "PENDIENTE DE APROBACIÓN", className: "bg-amber-600 border-amber-400" },
  invalid: { label: "QR INVÁLIDO", className: "bg-neutral-700 border-neutral-500" },
};

// Tamaño de la caja de escaneo en función del viewfinder real (no un valor
// fijo en px): con un valor fijo como 250 la librería se rompe en pantallas
// angostas de celular y deja de detectar QR ("no hace nada" al escanear).
function qrboxSize(viewfinderWidth: number, viewfinderHeight: number) {
  const size = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.7);
  return { width: Math.max(size, 180), height: Math.max(size, 180) };
}

export default function QrScanner({
  onScan,
  header,
  floatingButtons,
}: {
  onScan: (qrCode: string) => Promise<ActionResult<ScanResult>>;
  header?: React.ReactNode;
  floatingButtons?: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (result) return; // no re-render scanner while showing un resultado

    let cancelled = false;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (cancelled || !containerRef.current) return;
      setCameraError(null);

      const qr = new Html5Qrcode("qr-reader", { verbose: false });
      html5QrCodeRef.current = qr;

      qr.start(
        // Fuerza la cámara trasera: con la UI por defecto de la librería el
        // staff tenía que elegir cámara de un dropdown y a veces quedaba en
        // la frontal, que apunta para el lado que no es.
        { facingMode: "environment" },
        { fps: 10, qrbox: qrboxSize },
        async (decodedText) => {
          if (busyRef.current) return;
          busyRef.current = true;
          try {
            await qr.stop();
          } catch {
            // no-op
          }
          try {
            const res = await onScanRef.current(decodedText);
            if (isActionError(res)) {
              setError(res.error);
            } else {
              setResult(res);
            }
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
      ).catch((err) => {
        if (cancelled) return;
        const name = err instanceof Error ? err.name : "";
        setCameraError(
          name === "NotAllowedError"
            ? "Se necesita permiso de cámara para escanear. Habilitalo en los ajustes del navegador y volvé a intentar."
            : "No se pudo acceder a la cámara. Revisá que ningún otro sitio la esté usando.",
        );
      });
    });

    return () => {
      cancelled = true;
      html5QrCodeRef.current?.stop().catch(() => {});
    };
  }, [result]);

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
            {result.result === "ok_out" ? "Salió a las " : "Ingresó a las "}
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
      {header}
      {cameraError && (
        <div className="mb-3 rounded-md border border-red-700 bg-red-950/30 p-3 text-sm text-red-300">
          {cameraError}
        </div>
      )}
      <div id="qr-reader" ref={containerRef} className="overflow-hidden rounded-lg" />
      {floatingButtons}
    </div>
  );
}
