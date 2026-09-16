"use client";

import { useState } from "react";
import Link from "next/link";

export default function StatCard({
  label,
  value,
  description,
  href,
}: {
  label: string;
  value: string;
  description: string;
  href?: string;
}) {
  const [open, setOpen] = useState(false);

  if (href) {
    return (
      <Link
        href={href}
        title={description}
        className="block rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-left transition hover:border-lime-500"
      >
        <p className="text-xs uppercase text-neutral-500">{label}</p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-left transition hover:border-neutral-700"
    >
      <p className="text-xs uppercase text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {open && <p className="mt-2 text-xs text-neutral-400">{description}</p>}
    </button>
  );
}
