import type { ReactNode } from "react";
import LogoMark from "./logo-mark";

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12"
      style={{
        background:
          "radial-gradient(60% 50% at 50% 0%, rgba(163,230,53,0.08), transparent 60%), #0a0a0a",
      }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-lime-500/30 bg-lime-500/10 text-lime-400">
            <LogoMark className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-semibold text-white">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-neutral-400">{subtitle}</p>}
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 shadow-2xl shadow-black/40 backdrop-blur">
          {children}
        </div>
      </div>
    </div>
  );
}
