import { Suspense } from "react";

export default function VerifyOtpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          Loading verification…
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
