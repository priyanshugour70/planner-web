import { jsonSuccess, withApiRoute } from "@/lib/api/with-api-route";
import { getSql } from "@/lib/db";
import * as Auth from "@/server/auth/auth-service";
import { HttpError } from "@/server/auth/http-error";
import { noteCreateSchema } from "@/server/planner/schemas";
import { serializeNote, type NoteRow } from "@/server/planner/serialize";
import { ErrorCodes } from "@/types/api-error";

export const GET = withApiRoute(
  { module: "planner", action: "notes_list" },
  async ({ requestId, req }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const sql = getSql();
    const rows = await sql<NoteRow[]>`
      SELECT * FROM notes WHERE user_id = ${auth.userId}
      ORDER BY pinned DESC, updated_at DESC
      LIMIT 200
    `;
    return jsonSuccess(requestId, rows.map(serializeNote));
  }
);

export const POST = withApiRoute(
  { module: "planner", action: "notes_create", parseBody: noteCreateSchema },
  async ({ requestId, req, body }) => {
    const auth = await Auth.requireBearer(req.headers.get("authorization"));
    const sql = getSql();
    const [row] = await sql<NoteRow[]>`
      INSERT INTO notes (user_id, title, body, pinned, color)
      VALUES (
        ${auth.userId},
        ${body.title},
        ${body.body ?? ""},
        ${body.pinned ?? false},
        ${body.color ?? null}
      )
      RETURNING *
    `;
    if (!row) throw new HttpError(500, ErrorCodes.INTERNAL_ERROR, "Create failed");
    return jsonSuccess(requestId, serializeNote(row), { message: "Note created" });
  }
);
