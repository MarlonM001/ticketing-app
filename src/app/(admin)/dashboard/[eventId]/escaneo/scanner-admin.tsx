"use client";

import { useCallback } from "react";
import Link from "next/link";
import { scanTicketAsAdmin } from "./actions";
import QrScanner from "@/components/qr-scanner";

export default function ScannerAdmin({ eventId }: { eventId: string }) {
  const onScan = useCallback(
    (qrCode: string) => scanTicketAsAdmin(eventId, qrCode),
    [eventId],
  );

  return (
    <QrScanner
      onScan={onScan}
      header={
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-neutral-400">Control de ingreso · Admin</p>
          <Link href={`/dashboard/${eventId}`} className="text-sm text-lime-400">
            Volver al panel
          </Link>
        </div>
      }
    />
  );
}
