"use client";

import { AuthenticatedHome } from "@/components/home/authenticated-home";
import { LandingPage } from "@/components/home/landing-page";
import { useAuth } from "@/hooks/use-auth";

export function SmartHome() {
  const { isAuthenticated, authBootstrapDone } = useAuth();

  if (!authBootstrapDone) {
    return (
      <div className="min-h-screen bg-background" aria-busy="true" aria-label="Loading">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <div className="mx-auto h-10 max-w-md animate-pulse rounded-lg bg-muted" />
          <div className="mx-auto mt-6 h-4 max-w-lg animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <AuthenticatedHome />;
  }

  return <LandingPage />;
}
