/** OpenAPI path items for `/planner/*` — merged into the main document for mobile clients. */

const idParam = {
  name: "id",
  in: "path" as const,
  required: true,
  schema: { type: "string" },
};

const goalIdParam = {
  name: "id",
  in: "path" as const,
  required: true,
  schema: { type: "string" },
  description: "Goal id",
};

const milestoneIdParam = {
  name: "milestoneId",
  in: "path" as const,
  required: true,
  schema: { type: "string" },
};

const habitEntryIdParam = {
  name: "entryId",
  in: "path" as const,
  required: true,
  schema: { type: "string" },
};

const secured = (summary: string, extra?: { parameters?: object[] }) => ({
  tags: ["Planner"],
  summary,
  security: [{ bearerAuth: [] }],
  ...extra,
  responses: {
    "200": {
      description: "Standard success envelope; resource shape in `data` matches the Planner DTO for this route.",
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/SuccessEnvelope" },
        },
      },
    },
    "401": { description: "Missing or invalid Bearer token" },
  },
});

export const plannerOpenApiPaths: Record<string, Record<string, unknown>> = {
  "/planner/summary": {
    get: secured("Dashboard counts and finance rollups (PlannerSummaryDTO)"),
  },
  "/planner/finance/summary": {
    get: secured("Finance KPIs for the current user (FinanceSummaryDTO)"),
  },
  "/planner/goals": {
    get: secured("List goals (optional `status` query)"),
    post: secured("Create goal (JSON body validated server-side)"),
  },
  "/planner/goals/{id}": {
    get: secured("Get one goal", { parameters: [goalIdParam] }),
    patch: secured("Update goal", { parameters: [goalIdParam] }),
    delete: secured("Delete goal", { parameters: [goalIdParam] }),
  },
  "/planner/goals/{id}/milestones": {
    get: secured("List milestones for a goal", { parameters: [goalIdParam] }),
    post: secured("Create milestone", { parameters: [goalIdParam] }),
  },
  "/planner/goals/{id}/milestones/{milestoneId}": {
    patch: secured("Update milestone", { parameters: [goalIdParam, milestoneIdParam] }),
    delete: secured("Delete milestone", { parameters: [goalIdParam, milestoneIdParam] }),
  },
  "/planner/tasks": {
    get: secured("List tasks (supports filters via query string)"),
    post: secured("Create task"),
  },
  "/planner/tasks/{id}": {
    get: secured("Get one task", { parameters: [idParam] }),
    patch: secured("Update task", { parameters: [idParam] }),
    delete: secured("Delete task", { parameters: [idParam] }),
  },
  "/planner/habits": {
    get: secured("List habits"),
    post: secured("Create habit"),
  },
  "/planner/habits/{id}": {
    get: secured("Get one habit", { parameters: [idParam] }),
    patch: secured("Update habit", { parameters: [idParam] }),
    delete: secured("Delete habit", { parameters: [idParam] }),
  },
  "/planner/habits/{id}/entries": {
    get: secured("List habit entries", { parameters: [idParam] }),
    post: secured("Log a habit entry", { parameters: [idParam] }),
  },
  "/planner/habits/{id}/entries/{entryId}": {
    delete: secured("Delete a habit entry", { parameters: [idParam, habitEntryIdParam] }),
  },
  "/planner/journal": {
    get: secured("List journal entries"),
    post: secured("Create journal entry"),
  },
  "/planner/journal/{id}": {
    get: secured("Get journal entry", { parameters: [idParam] }),
    patch: secured("Update journal entry", { parameters: [idParam] }),
    delete: secured("Delete journal entry", { parameters: [idParam] }),
  },
  "/planner/notes": {
    get: secured("List notes"),
    post: secured("Create note"),
  },
  "/planner/notes/{id}": {
    get: secured("Get note", { parameters: [idParam] }),
    patch: secured("Update note", { parameters: [idParam] }),
    delete: secured("Delete note", { parameters: [idParam] }),
  },
  "/planner/calendar-events": {
    get: secured("List calendar events"),
    post: secured("Create calendar event"),
  },
  "/planner/calendar-events/{id}": {
    get: secured("Get calendar event", { parameters: [idParam] }),
    patch: secured("Update calendar event", { parameters: [idParam] }),
    delete: secured("Delete calendar event", { parameters: [idParam] }),
  },
  "/planner/transactions": {
    get: secured("List transactions (filters via query)"),
    post: secured("Create transaction"),
  },
  "/planner/transactions/{id}": {
    get: secured("Get transaction", { parameters: [idParam] }),
    patch: secured("Update transaction", { parameters: [idParam] }),
    delete: secured("Delete transaction", { parameters: [idParam] }),
  },
  "/planner/budgets": {
    get: secured("List budgets"),
    post: secured("Create budget"),
  },
  "/planner/budgets/{id}": {
    get: secured("Get budget", { parameters: [idParam] }),
    patch: secured("Update budget", { parameters: [idParam] }),
    delete: secured("Delete budget", { parameters: [idParam] }),
  },
  "/planner/finance/budget-rollup": {
    get: secured("Per-budget spend vs limit for each budget period"),
  },
  "/planner/finance/recurring-rules": {
    get: secured("List recurring / EMI templates"),
    post: secured("Create recurring rule (monthly cadence)"),
  },
  "/planner/finance/recurring-rules/materialize-due": {
    post: secured("Create transactions for due recurring rules up to throughDate (default today UTC)"),
  },
  "/planner/finance/recurring-rules/{id}": {
    get: secured("Get recurring rule", { parameters: [idParam] }),
    patch: secured("Update recurring rule", { parameters: [idParam] }),
    delete: secured("Delete recurring rule", { parameters: [idParam] }),
  },
  "/planner/finance/accounts": {
    get: secured("List finance accounts (cash, bank, card, …)"),
    post: secured("Create finance account"),
  },
  "/planner/finance/accounts/{id}": {
    get: secured("Get finance account", { parameters: [idParam] }),
    patch: secured("Update finance account", { parameters: [idParam] }),
    delete: secured("Delete finance account", { parameters: [idParam] }),
  },
  "/planner/finance/categories": {
    get: secured("List finance categories"),
    post: secured("Create finance category"),
  },
  "/planner/finance/categories/{id}": {
    get: secured("Get finance category", { parameters: [idParam] }),
    patch: secured("Update finance category", { parameters: [idParam] }),
    delete: secured("Delete finance category", { parameters: [idParam] }),
  },
  "/planner/debt/obligations": {
    get: secured("List debt obligations"),
    post: secured("Create debt obligation"),
  },
  "/planner/debt/obligations/{id}": {
    get: secured("Get debt obligation", { parameters: [idParam] }),
    patch: secured("Update debt obligation", { parameters: [idParam] }),
    delete: secured("Delete debt obligation", { parameters: [idParam] }),
  },
  "/planner/debt/obligations/{id}/payments": {
    get: secured("List payments for an obligation", { parameters: [idParam] }),
    post: secured("Record a payment (reduces balance)", { parameters: [idParam] }),
  },
};
