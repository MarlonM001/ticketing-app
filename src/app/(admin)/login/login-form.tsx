"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AuthShell from "@/components/auth-shell";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError("Email o contraseña incorrectos.");
      return;
    }

    router.push(searchParams.get("next") ?? "/dashboard");
    router.refresh();
  }

  return (
    <AuthShell title="Panel del organizador" subtitle="Ingresá con tu cuenta para gestionar tus eventos">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm text-neutral-400">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-white outline-none transition focus:border-lime-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-neutral-400">Contraseña</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-white outline-none transition focus:border-lime-500"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-lime-500 px-3 py-2.5 font-medium text-neutral-950 transition hover:bg-lime-400 disabled:opacity-50"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>

        <p className="text-center text-xs text-neutral-500">
          Este login es solo para el organizador. Si sos staff (caja, puerta, mesero, dj), pedile
          el link de acceso al organizador.
        </p>
      </form>
    </AuthShell>
  );
}
