"use client";

import ErrorFallback from "@/components/error-fallback";

export default function AdminError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ErrorFallback retry={retry} />;
}
