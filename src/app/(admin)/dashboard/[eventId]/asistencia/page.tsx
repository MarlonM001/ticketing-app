import Link from "next/link";
import { getAsistenciaRows } from "./get-rows";
import AsistenciaClient from "./asistencia-client";

export default async function AsistenciaPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const rows = await getAsistenciaRows(eventId, false);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Asistencia</h1>
        <Link href={`/dashboard/${eventId}/asistencia/staff`} className="text-sm text-lime-400">
          Ver solo staff
        </Link>
      </div>
      <AsistenciaClient rows={rows} />
    </div>
  );
}
