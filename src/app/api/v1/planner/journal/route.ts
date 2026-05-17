import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import { getSql } from "@/lib/db";
import * as Auth from "@/modules/auth/server/auth-service";
import { HttpError } from "@/modules/auth/server/http-error";
import { journalCreateSchema } from "@/modules/journal/server/schemas";
import { serializeJournal, computeWordCount, type JournalRow } from "@/modules/journal/server/serialize";
import { getPromptForDate } from "@/modules/journal/server/analytics";
import { ErrorCodes } from "@/types/api-error";

export const GET = withApiRoute(
  { module: "planner", action: "journal_list" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const sql = getSql();

    const params = req.nextUrl.searchParams;
    const mood = params.get("mood");
    const from = params.get("from");
    const to = params.get("to");
    const favoritesOnly = params.get("favoritesOnly") === "true";
    const search = params.get("q");
    const limit = Math.min(500, Math.max(1, Number(params.get("limit") || 100)));

    const rows = await sql<JournalRow[]>`
      SELECT * FROM journal_entries
      WHERE user_id = ${auth.userId}
        AND (${!mood} OR mood = ${mood ?? ""})
        AND (${!from} OR entry_date >= ${from ?? "1900-01-01"}::date)
        AND (${!to} OR entry_date <= ${to ?? "2999-12-31"}::date)
        AND (${!favoritesOnly} OR is_favorite = TRUE)
        AND (${!search} OR (title ILIKE ${"%" + (search ?? "") + "%"} OR body ILIKE ${"%" + (search ?? "") + "%"}))
      ORDER BY entry_date DESC, updated_at DESC
      LIMIT ${limit}
    `;
    return jsonSuccess(requestId, rows.map(serializeJournal), {
      meta: { promptOfTheDay: getPromptForDate() },
    });
  }
);

export const POST = withApiRoute(
  { module: "planner", action: "journal_create", parseBody: journalCreateSchema },
  async ({ requestId, req, body }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const sql = getSql();
    const entryDate = body.entryDate ?? new Date().toISOString().slice(0, 10);
    const tags = body.tags ?? [];
    const wordCount = computeWordCount(body.body);
    const [row] = await sql<JournalRow[]>`
      INSERT INTO journal_entries (user_id, title, body, mood, entry_date, tags, is_favorite, word_count, prompt, energy_level, weather, location)
      VALUES (
        ${auth.userId},
        ${body.title ?? ""},
        ${body.body ?? ""},
        ${body.mood ?? null},
        ${entryDate},
        ${sql.array(tags)},
        ${body.isFavorite ?? false},
        ${wordCount},
        ${body.prompt ?? null},
        ${body.energyLevel ?? null},
        ${body.weather ?? null},
        ${body.location ?? null}
      )
      RETURNING *
    `;
    if (!row) throw new HttpError(500, ErrorCodes.INTERNAL_ERROR, "Create failed");
    return jsonSuccess(requestId, serializeJournal(row), { message: "Journal entry saved" });
  }
);
