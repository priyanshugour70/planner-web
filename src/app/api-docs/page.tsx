import Link from "next/link";

const specUrl = "/api/v1/docs/openapi";

export default function ApiDocsPage() {
  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col gap-6 px-6 py-16 text-zinc-900 dark:text-zinc-50">
      <h1 className="text-2xl font-semibold tracking-tight">API documentation</h1>
      <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        OpenAPI 3 specification for version 1. Import the JSON into Postman, Insomnia, or your
        mobile OpenAPI generator. Bearer JWT is used for protected routes.
      </p>
      <div className="flex flex-wrap gap-3">
        <a
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          href={specUrl}
        >
          Download OpenAPI JSON
        </a>
        <Link
          className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          href="/"
        >
          Back to home
        </Link>
      </div>
      <pre className="overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
        {specUrl}
      </pre>
    </div>
  );
}
