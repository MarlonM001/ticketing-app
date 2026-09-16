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
  reentry_expired: { label: "SALIÓ HACE MÁS DE 5 HORAS", className: "bg-orange-600 border-orange-400" },
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
  onScan: (qrCode: string, force?: boolean) => Promise<ActionResult<ScanResult>>;
  header?: React.ReactNode;
  floatingButtons?: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  const lastQrCodeRef = useRef<string | null>(null);
  // La cámara arranca solo cuando el usuario toca "Escanear QR" — no se
  // reactiva sola después de mostrar un resultado, hay que volver a tocar
  // el botón cada vez. Esto evita que la cámara quede prendida sin uso y
  // hace que cualquier falla de cámara quede acotada a un solo intento.
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [forcing, setForcing] = useState(false);
  const busyRef = useRef(false);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!scanning) return;

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
          // Importante: NO tocar `scanning` acá. Cambiarlo desmonta el div
          // #qr-reader en el mismo instante en que la librería puede seguir
          // limpiando referencias internas sobre ese nodo, lo que tiraba una
          // excepción real y activaba la pantalla de error. `result`/`error`
          // ya tienen prioridad en el render, así que alcanza con setearlos.
          lastQrCodeRef.current = decodedText;
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
        setScanning(false);
        setCameraError(
          name === "NotAllowedError"
            ? "Se necesita permiso de cámara para escanear. Habilitalo en los ajustes del navegador y volvé a intentar."
            : "No se pudo acceder a la cámara. Revisá que ningún otro sitio la esté usando.",
        );
      });
    });

    return () => {
      cancelled = true;
      try {
        html5QrCodeRef.current?.stop().catch(() => {});
      } catch {
        // no-op: algunas versiones de la librería pueden tirar sincrónico
        // si el nodo del DOM ya no está, no debe tumbar la pantalla.
      }
    };
  }, [scanning]);

  async function forceReentry() {
    const qrCode = lastQrCodeRef.current;
    if (!qrCode || forcing) return;
    setForcing(true);
    try {
      const res = await onScanRef.current(qrCode, true);
      if (isActionError(res)) {
        setError(res.error);
      } else {
        setResult(res);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al escanear");
    } finally {
      setForcing(false);
    }
  }

  function reset() {
    setError(null);
    setResult(null);
    setCameraError(null);
    setScanning(false);
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center text-red-400">
        {error}
        <button
          onClick={reset}
          className="mt-2 block w-full max-w-xs rounded-md border border-neutral-700 px-3 py-2 text-white"
        >
          Reintentar
        </button>
        {floatingButtons}
      </div>
    );
  }

  if (result) {
    const style = STATE_STYLES[result.result];
    const isReentryExpired = result.result === "reentry_expired";
    return (
      <div className={`flex min-h-screen flex-col items-center justify-center gap-4 border-8 p-6 text-center text-white ${style.className}`}>
        <p className="text-3xl font-black">{style.label}</p>
        {result.guest_name && <p className="text-xl">{result.guest_name}</p>}
        {result.ticket_type_name && <p className="text-neutral-200">{result.ticket_type_name}</p>}
        {result.scanned_at && (
          <p className="text-sm text-neutral-200">
            {result.result === "ok_in" ? "Ingresó a las " : "Salió a las "}
            {new Date(result.scanned_at).toLocaleTimeString("es-AR")}
          </p>
        )}
        {isReentryExpired ? (
          <div className="mt-4 flex w-full max-w-xs flex-col gap-2">
            <button
              onClick={forceReentry}
              disabled={forcing}
              className="rounded-md bg-white px-6 py-3 font-medium text-neutral-950 disabled:opacity-50"
            >
              {forcing ? "Ingresando..." : "Ingresar de todas formas"}
            </button>
            <button
              onClick={reset}
              disabled={forcing}
              className="rounded-md border border-white/60 px-6 py-3 font-medium text-white disabled:opacity-50"
            >
              No dejar pasar
            </button>
          </div>
        ) : (
          <button
            onClick={reset}
            className="mt-4 rounded-md bg-white px-6 py-3 font-medium text-neutral-950"
          >
            Escanear siguiente
          </button>
        )}
        {floatingButtons}
      </div>
    );
  }

  if (!scanning) {
    return (
      <div className="flex min-h-screen flex-col bg-neutral-950 p-4 text-white">
        {header}
        {cameraError && (
          <div className="mb-3 rounded-md border border-red-700 bg-red-950/30 p-3 text-sm text-red-300">
            {cameraError}
          </div>
        )}
        <div className="flex flex-1 items-center justify-center">
          <button
            onClick={() => setScanning(true)}
            className="flex h-40 w-40 flex-col items-center justify-center gap-2 rounded-full bg-lime-500 text-neutral-950 shadow-lg transition active:scale-95"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-10 w-10">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20v.01" />
            </svg>
            <span className="text-sm font-bold">Escanear QR</span>
          </button>
        </div>
        {floatingButtons}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-4 text-white">
      {header}
      <div id="qr-reader" ref={containerRef} className="overflow-hidden rounded-lg" />
      <button
        onClick={() => setScanning(false)}
        className="mt-3 w-full rounded-md border border-neutral-700 px-3 py-2 text-sm"
      >
        Cancelar
      </button>
      {floatingButtons}
    </div>
  );
}
