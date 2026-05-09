"use client";

import { ThemeProvider } from "next-themes";
import { AuthBootstrap } from "@/components/auth/auth-bootstrap";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthBootstrap>{children}</AuthBootstrap>
      <Toaster richColors position="top-center" />
    </ThemeProvider>
  );
}
