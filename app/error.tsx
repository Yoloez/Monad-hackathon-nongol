"use client";

import { ErrorState } from "@/components/ui/feedback";

// Next.js 16.4 local guide exposes retry (reset is deprecated).
export default function Error({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <div className="container route-feedback">
      <ErrorState
        message="Halaman belum berhasil ditampilkan. Silakan muat ulang kontennya."
        onRetry={retry}
      />
    </div>
  );
}
