"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginStaff } from "../actions";
import RoleIcon from "@/components/role-icon";
import type { StaffRole } from "@/lib/staff-session";

const ROLES: StaffRole[] = ["puerta", "caja", "mesero", "dj"];
const ROLE_LABEL: Record<StaffRole, string> = {
  puerta: "Puerta",
  caja: "Caja",
  mesero: "Mesero",
  dj: "DJ",
};

export default function ActivateClient({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { role } = await loginStaff(eventId, username.trim(), password, name.trim());
      if (role === "puerta") {
        router.replace(`/scan/${eventId}`);
      } else if (role === "caja") {
        router.replace(`/caja/${eventId}`);
      } else {
        router.replace(`/scan/${eventId}/asistencia`);
      }
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-center gap-4">
        {ROLES.map((role) => (
          <div key={role} className="flex flex-col items-center gap-1 text-neutral-500">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950">
              <RoleIcon role={role} className="h-[18px] w-[18px]" />
            </div>
            <span className="text-[10px]">{ROLE_LABEL[role]}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm text-neutral-400">Usuario</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-white outline-none transition focus:border-lime-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-neutral-400">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-white outline-none transition focus:border-lime-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-neutral-400">Tu nombre (para identificar tus acciones)</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Juan"
            required
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
      </form>
    </div>
  );
}
