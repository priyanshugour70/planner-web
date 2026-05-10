-- Faster title search and parent lookups for task lists at scale.
CREATE INDEX IF NOT EXISTS tasks_user_title_lower_idx ON tasks (user_id, (lower(title)));
CREATE INDEX IF NOT EXISTS tasks_user_parent_idx ON tasks (user_id, parent_task_id);
