import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import { getSql } from "@/lib/db";
import * as Auth from "@/server/auth/auth-service";
import { HttpError } from "@/server/auth/http-error";
import { journalCreateSchema } from "@/modules/journal/server/schemas";
import { serializeJournal, type JournalRow } from "@/modules/journal/server/serialize";
import { ErrorCodes } from "@/types/api-error";

export const GET = withApiRoute(
  { module: "planner", action: "journal_list" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const sql = getSql();
    const rows = await sql<JournalRow[]>`
      SELECT * FROM journal_entries WHERE user_id = ${auth.userId}
      ORDER BY entry_date DESC, updated_at DESC
      LIMIT 100
    `;
    return jsonSuccess(requestId, rows.map(serializeJournal));
  }
);

export const POST = withApiRoute(
  { module: "planner", action: "journal_create", parseBody: journalCreateSchema },
  async ({ requestId, req, body }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const sql = getSql();
    const entryDate = body.entryDate ?? new Date().toISOString().slice(0, 10);
    const tags = body.tags ?? [];
    const [row] = await sql<JournalRow[]>`
      INSERT INTO journal_entries (user_id, title, body, mood, entry_date, tags)
      VALUES (
        ${auth.userId},
        ${body.title ?? ""},
        ${body.body ?? ""},
        ${body.mood ?? null},
        ${entryDate},
        ${sql.array(tags)}
      )
      RETURNING *
    `;
    if (!row) throw new HttpError(500, ErrorCodes.INTERNAL_ERROR, "Create failed");
    return jsonSuccess(requestId, serializeJournal(row), { message: "Journal entry saved" });
  }
);
