import Link from "next/link";
import { AuthBar } from "@/components/home/auth-bar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const modules = [
  {
    title: "Goals",
    desc: "Outcomes, progress, and milestones so big work stays traceable.",
    href: "/goals",
  },
  {
    title: "Tasks",
    desc: "Statuses, due dates, tags, and optional links to goals and subtasks.",
    href: "/tasks",
  },
  {
    title: "Finance",
    desc: "Income and expense lines plus budgets across periods you define.",
    href: "/finance",
  },
  {
    title: "Habits",
    desc: "Daily or weekly rhythms with one-tap logging and history per habit.",
    href: "/habits",
  },
  {
    title: "Journal",
    desc: "Dated entries for reflection—title, body, mood, and tags when you need them.",
    href: "/journal",
  },
  {
    title: "Notes",
    desc: "Fast capture with pinning so important snippets stay on top.",
    href: "/notes",
  },
  {
    title: "Calendar",
    desc: "Events in time, optionally tied to tasks or goals for context.",
    href: "/calendar",
  },
] as const;

const pillars = [
  {
    title: "Secure auth",
    body: "JWT access tokens, refresh rotation, sessions, OTP flows, and audit-friendly APIs.",
  },
  {
    title: "PostgreSQL",
    body: "First-class SQL migrations—no ORM magic—so your data model stays explicit and portable.",
  },
  {
    title: "Typed client",
    body: "Types → HTTP client → services → Zustand → hooks → UI, ready for web and mobile shells.",
  },
];

export function LandingPage() {
  return (
    <div className="flex min-h-full flex-col bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Planner
          </Link>
          <AuthBar />
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden border-b">
          <div
            className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-30"
            style={{
              background:
                "radial-gradient(ellipse 80% 50% at 50% -20%, oklch(0.55 0.2 264 / 0.35), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, oklch(0.65 0.15 230 / 0.2), transparent)",
            }}
          />
          <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <Badge variant="secondary" className="uppercase tracking-widest">
              End-to-end life OS
            </Badge>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl sm:leading-tight">
              One calm place for goals, money, habits, and everything between.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Planner is a structured workspace: seven modules, shared auth, and REST APIs you can grow
              with—whether you live in the web app or wire your own clients.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/signup" className={cn(buttonVariants({ size: "lg" }))}>
                Create account
              </Link>
              <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                Sign in
              </Link>
              <Link href="/dashboard" className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}>
                Open dashboard →
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight">Seven modules, one account</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Each area has its own data model and APIs—use them together or start with what matters most
            today.
          </p>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((m) => (
              <li key={m.href}>
                <Link href={m.href} className="block h-full">
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <CardHeader>
                      <CardTitle className="text-base">{m.title}</CardTitle>
                      <CardDescription className="text-pretty">{m.desc}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <span className="text-sm font-medium text-primary">Explore →</span>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-y bg-card py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight">Built for clarity and scale</h2>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {pillars.map((p) => (
                <Card key={p.title}>
                  <CardHeader>
                    <CardTitle className="text-base">{p.title}</CardTitle>
                    <CardDescription className="text-pretty">{p.body}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
            <p className="mt-10 text-sm text-muted-foreground">
              OpenAPI lives at{" "}
              <Link href="/api-docs" className="font-medium text-primary underline-offset-2 hover:underline">
                /api-docs
              </Link>
              —same contract your automations and future apps can rely on.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight">Ready when you are</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Sign up in a minute, land on the dashboard, and shape the modules around your real routines.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/signup" className={cn(buttonVariants({ size: "lg" }))}>
              Get started
            </Link>
            <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
              I already have an account
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t bg-card py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <span suppressHydrationWarning>© {new Date().getFullYear()} Planner</span>
          <div className="flex gap-6">
            <Link href="/api-docs" className="hover:text-foreground">
              API
            </Link>
            <Link href="/login" className="hover:text-foreground">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
