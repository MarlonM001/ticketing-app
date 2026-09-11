"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { activateStaffAccess } from "../actions";

export default function ActivateClient({
  eventId,
  initialToken,
}: {
  eventId: string;
  initialToken?: string;
}) {
  const router = useRouter();
  const [token, setToken] = useState(initialToken ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function activate(t: string) {
    setLoading(true);
    setError(null);
    try {
      await activateStaffAccess(eventId, t);
      router.replace(`/scan/${eventId}`);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  useEffect(() => {
    if (initialToken) activate(initialToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialToken]);

  if (initialToken) {
    return (
      <p className="text-neutral-400">
        {loading ? "Validando acceso..." : error ?? "Redirigiendo..."}
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        activate(token.trim());
      }}
      className="w-full max-w-sm space-y-3"
    >
      <label className="text-sm text-neutral-400">Código de acceso</label>
      <input
        value={token}
        onChange={(e) => setToken(e.target.value)}
        className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2"
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading || !token.trim()}
        className="w-full rounded-md bg-lime-500 px-3 py-2 font-medium text-neutral-950 disabled:opacity-50"
      >
        {loading ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}
