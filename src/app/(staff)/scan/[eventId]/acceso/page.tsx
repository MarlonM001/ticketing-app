import ActivateClient from "./activate-client";

export default async function AccesoPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { eventId } = await params;
  const { token } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-950 px-4 text-white">
      <h1 className="text-lg font-semibold">Acceso de staff</h1>
      <ActivateClient eventId={eventId} initialToken={token} />
    </div>
  );
}
