"use client";

export default function ErrorFallback({ retry }: { retry: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-950 p-6 text-center text-white">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-lime-500/15">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-10 w-10 text-lime-400"
          aria-hidden="true"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <p className="text-lg font-semibold">Se cortó por un instante</p>
      <p className="max-w-xs text-sm text-neutral-400">
        Puede haber sido un problema de conexión. Si estabas escaneando o cargando algo, es
        probable que ya haya quedado guardado — tocá para volver a la pantalla.
      </p>
      <button
        onClick={retry}
        className="rounded-md bg-lime-500 px-6 py-3 font-medium text-neutral-950"
      >
        Volver a intentar
      </button>
    </div>
  );
}
