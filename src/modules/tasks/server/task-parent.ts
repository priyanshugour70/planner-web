import type { SqlClient } from "@/lib/db";

/**
 * Returns true if assigning `proposedParentId` as the parent of `childId` would create a cycle.
 * Walks ancestors from the proposed parent upward within the same user.
 */
export async function taskParentWouldCycle(
  sql: SqlClient,
  userId: bigint,
  childId: bigint,
  proposedParentId: bigint
): Promise<boolean> {
  if (proposedParentId === childId) return true;
  const rows = await sql<{ hit: boolean }[]>`
    WITH RECURSIVE anc AS (
      SELECT id, parent_task_id
      FROM tasks
      WHERE id = ${proposedParentId} AND user_id = ${userId}
      UNION ALL
      SELECT t.id, t.parent_task_id
      FROM tasks t
      INNER JOIN anc ON t.id = anc.parent_task_id AND t.user_id = ${userId}
    )
    SELECT EXISTS (SELECT 1 FROM anc WHERE id = ${childId}) AS hit
  `;
  return Boolean(rows[0]?.hit);
}
