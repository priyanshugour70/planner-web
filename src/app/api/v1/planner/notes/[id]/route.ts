import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import { getSql } from "@/lib/db";
import * as Auth from "@/server/auth/auth-service";
import { HttpError } from "@/server/auth/http-error";
import { bigIntPathId } from "@/server/planner/path-ids";
import { notePatchSchema } from "@/server/planner/schemas";
import { serializeNote, type NoteRow } from "@/server/planner/serialize";
import { ErrorCodes } from "@/types/api-error";

const re = /\/planner\/notes\/(\d+)\/?$/;

export const GET = withApiRoute(
  { module: "planner", action: "notes_get" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const id = bigIntPathId(req, re);
    const sql = getSql();
    const [row] = await sql<NoteRow[]>`
      SELECT * FROM notes WHERE id = ${id} AND user_id = ${auth.userId} LIMIT 1
    `;
    if (!row) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Note not found");
    return jsonSuccess(requestId, serializeNote(row));
  }
);

export const PATCH = withApiRoute(
  { module: "planner", action: "notes_patch", parseBody: notePatchSchema },
  async ({ requestId, req, body }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const id = bigIntPathId(req, re);
    const sql = getSql();
    const [existing] = await sql<NoteRow[]>`
      SELECT * FROM notes WHERE id = ${id} AND user_id = ${auth.userId} LIMIT 1
    `;
    if (!existing) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Note not found");

    const title = body.title !== undefined ? body.title : existing.title;
    const noteBody = body.body !== undefined ? body.body : existing.body;
    const pinned = body.pinned !== undefined ? body.pinned : existing.pinned;
    const color = body.color !== undefined ? body.color : existing.color;

    const [row] = await sql<NoteRow[]>`
      UPDATE notes SET title = ${title}, body = ${noteBody}, pinned = ${pinned}, color = ${color}
      WHERE id = ${id} AND user_id = ${auth.userId}
      RETURNING *
    `;
    if (!row) throw new HttpError(500, ErrorCodes.INTERNAL_ERROR, "Update failed");
    return jsonSuccess(requestId, serializeNote(row), { message: "Note updated" });
  }
);

export const DELETE = withApiRoute(
  { module: "planner", action: "notes_delete" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const id = bigIntPathId(req, re);
    const sql = getSql();
    const rows = await sql`DELETE FROM notes WHERE id = ${id} AND user_id = ${auth.userId} RETURNING id`;
    if (!rows.length) throw new HttpError(404, ErrorCodes.NOT_FOUND, "Note not found");
    return jsonSuccess(requestId, { ok: true as const }, { message: "Note deleted" });
  }
);
