"use client";

import ErrorFallback from "@/components/error-fallback";

export default function StaffError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <ErrorFallback retry={retry} />;
}
