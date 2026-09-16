import Link from "next/link";
import { getAsistenciaRows } from "../get-rows";
import AsistenciaClient from "../asistencia-client";

export default async function AsistenciaStaffPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const rows = await getAsistenciaRows(eventId, true);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Asistencia · Staff</h1>
        <Link href={`/dashboard/${eventId}/asistencia`} className="text-sm text-lime-400">
          Ver todos
        </Link>
      </div>
      <AsistenciaClient rows={rows} />
    </div>
  );
}
