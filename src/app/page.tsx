import { AuthBar } from "@/components/home/auth-bar";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-20">
        <header className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Planner
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Enterprise auth stack
          </h1>
          <p className="max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
            REST v1 APIs with audit logging, refresh rotation, OTP flows, and a mobile-ready client
            pipeline (types → client → services → store → hooks → UI).
          </p>
        </header>
        <AuthBar />
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
          <h2 className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-50">Backend</h2>
          <ul className="list-inside list-disc space-y-1">
            <li>PostgreSQL schema with users, profiles, sessions, refresh tokens, OTP, audit, roles</li>
            <li>JWT access tokens with revocation table and bcrypt password hashing</li>
            <li>OpenAPI description at /api/v1/docs/openapi</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
