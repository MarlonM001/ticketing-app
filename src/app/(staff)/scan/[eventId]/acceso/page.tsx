import AuthShell from "@/components/auth-shell";
import ActivateClient from "./activate-client";

export default async function AccesoPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  return (
    <AuthShell title="Acceso de staff" subtitle="Caja · Puerta · Mesero · DJ · Vendedor">
      <ActivateClient eventId={eventId} />
    </AuthShell>
  );
}
