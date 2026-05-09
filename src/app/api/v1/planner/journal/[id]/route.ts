import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import { getSql } from "@/lib/db";
import * as Auth from "@/server/auth/auth-service";
import { HttpError } from "@/server/auth/http-error";
import { bigIntPathId } from "@/modules/shared/server/path-ids";
import { journalPatchSchema } from "@/modules/journal/server/schemas";
import { serializeJournal, type JournalRow } from "@/modules/journal/server/serialize";
import { ErrorCodes } from "@/types/api-error";

const re = /\/planner\/journal\/(\d+)\/?$/;

export const GET = withApiRoute(
  { module: "planner", action: "journal_get" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const id = bigIntPathId(req, re);
    const sql = getSql();
    const [row] = await sql<JournalRow[]>`
      SELECT * FROM journal_entries WHERE id = ${id} AND user_id = ${auth.userId} LIMIT 1
    `;
    if (!row) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Entry not found");
    return jsonSuccess(requestId, serializeJournal(row));
  }
);

export const PATCH = withApiRoute(
  { module: "planner", action: "journal_patch", parseBody: journalPatchSchema },
  async ({ requestId, req, body }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const id = bigIntPathId(req, re);
    const sql = getSql();
    const [existing] = await sql<JournalRow[]>`
      SELECT * FROM journal_entries WHERE id = ${id} AND user_id = ${auth.userId} LIMIT 1
    `;
    if (!existing) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Entry not found");

    const title = body.title !== undefined ? body.title : existing.title;
    const journalBody = body.body !== undefined ? body.body : existing.body;
    const mood = body.mood !== undefined ? body.mood : existing.mood;
    const entryDate =
      body.entryDate !== undefined ? body.entryDate : existing.entry_date.toISOString().slice(0, 10);
    const tags = body.tags !== undefined ? body.tags : existing.tags;

    const [row] = await sql<JournalRow[]>`
      UPDATE journal_entries SET
        title = ${title},
        body = ${journalBody},
        mood = ${mood},
        entry_date = ${entryDate},
        tags = ${sql.array(tags)}
      WHERE id = ${id} AND user_id = ${auth.userId}
      RETURNING *
    `;
    if (!row) throw new HttpError(500, ErrorCodes.INTERNAL_ERROR, "Update failed");
    return jsonSuccess(requestId, serializeJournal(row), { message: "Entry updated" });
  }
);

export const DELETE = withApiRoute(
  { module: "planner", action: "journal_delete" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const id = bigIntPathId(req, re);
    const sql = getSql();
    const rows = await sql`DELETE FROM journal_entries WHERE id = ${id} AND user_id = ${auth.userId} RETURNING id`;
    if (!rows.length) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Entry not found");
    return jsonSuccess(requestId, { ok: true as const }, { message: "Entry deleted" });
  }
);
