import Link from "next/link";
import { AuthBar } from "@/components/home/auth-bar";

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
    <div className="flex min-h-full flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-white/85 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/85">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Planner
          </Link>
          <AuthBar />
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-zinc-200 dark:border-zinc-800">
          <div
            className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-30"
            style={{
              background:
                "radial-gradient(ellipse 80% 50% at 50% -20%, rgb(99 102 241 / 0.35), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, rgb(14 165 233 / 0.2), transparent)",
            }}
          />
          <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <p className="text-sm font-medium uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              End-to-end life OS
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl sm:leading-tight">
              One calm place for goals, money, habits, and everything between.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              Planner is a structured workspace: seven modules, shared auth, and REST APIs you can grow
              with—whether you live in the web app or wire your own clients.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                Create account
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
              >
                Sign in
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-400"
              >
                Open dashboard →
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight">Seven modules, one account</h2>
          <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
            Each area has its own data model and APIs—use them together or start with what matters most
            today.
          </p>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((m) => (
              <li key={m.href}>
                <Link
                  href={m.href}
                  className="group flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-600"
                >
                  <span className="text-base font-semibold text-zinc-900 group-hover:text-indigo-600 dark:text-zinc-50 dark:group-hover:text-indigo-400">
                    {m.title}
                  </span>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{m.desc}</p>
                  <span className="mt-4 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                    Explore →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-y border-zinc-200 bg-white py-16 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight">Built for clarity and scale</h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {pillars.map((p) => (
                <div key={p.title}>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{p.body}</p>
                </div>
              ))}
            </div>
            <p className="mt-10 text-sm text-zinc-500 dark:text-zinc-500">
              OpenAPI lives at{" "}
              <Link href="/api-docs" className="font-medium text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400">
                /api-docs
              </Link>
              —same contract your automations and future apps can rely on.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight">Ready when you are</h2>
          <p className="mx-auto mt-3 max-w-xl text-zinc-600 dark:text-zinc-400">
            Sign up in a minute, land on the dashboard, and shape the modules around your real routines.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Get started
            </Link>
            <Link href="/login" className="inline-flex rounded-xl border border-zinc-300 px-6 py-3 text-sm font-semibold dark:border-zinc-600">
              I already have an account
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 bg-white py-8 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-zinc-500 sm:flex-row sm:px-6">
          <span suppressHydrationWarning>© {new Date().getFullYear()} Planner</span>
          <div className="flex gap-6">
            <Link href="/api-docs" className="hover:text-zinc-800 dark:hover:text-zinc-300">
              API
            </Link>
            <Link href="/login" className="hover:text-zinc-800 dark:hover:text-zinc-300">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
