export default function CreditBanner({
  creditCents,
  creditMessage,
}: {
  creditCents: number;
  creditMessage: string | null;
}) {
  if (creditCents <= 0) return null;

  return (
    <div className="mb-4 rounded-md border border-lime-600 bg-lime-950/30 p-3 text-sm text-white">
      <p className="font-semibold text-lime-300">
        🎁 El organizador te regaló ${(creditCents / 100).toLocaleString("es-AR")} para tomar algo
      </p>
      {creditMessage && <p className="mt-1 text-neutral-300">{creditMessage}</p>}
      <p className="mt-1 text-xs text-neutral-500">Usalo en &quot;Pedir algo&quot;</p>
    </div>
  );
}
