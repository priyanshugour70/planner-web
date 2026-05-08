"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="shadow-md ring-1 ring-border/60">
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

export function AuthFooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-primary underline-offset-4 hover:underline"
    >
      {children}
    </Link>
  );
}
