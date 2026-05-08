-- Planner domain: goals, tasks, finance, habits, journal, notes, calendar
-- Idempotent enums for partial re-runs

DO $$ BEGIN
  CREATE TYPE goal_status AS ENUM ('active', 'completed', 'archived', 'paused');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE finance_tx_kind AS ENUM ('income', 'expense');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE habit_frequency AS ENUM ('daily', 'weekly', 'custom');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Goals
CREATE TABLE IF NOT EXISTS goals (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status goal_status NOT NULL DEFAULT 'active',
  priority SMALLINT NOT NULL DEFAULT 2,
  target_date DATE,
  progress SMALLINT NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS goals_user_idx ON goals (user_id);
CREATE INDEX IF NOT EXISTS goals_user_status_idx ON goals (user_id, status);

CREATE TABLE IF NOT EXISTS milestones (
  id BIGSERIAL PRIMARY KEY,
  goal_id BIGINT NOT NULL REFERENCES goals (id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS milestones_goal_idx ON milestones (goal_id);

-- Tasks (optional hierarchy via parent_task_id)
CREATE TABLE IF NOT EXISTS tasks (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  goal_id BIGINT REFERENCES goals (id) ON DELETE SET NULL,
  parent_task_id BIGINT REFERENCES tasks (id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'todo',
  priority SMALLINT NOT NULL DEFAULT 2,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tasks_user_idx ON tasks (user_id);
CREATE INDEX IF NOT EXISTS tasks_user_status_idx ON tasks (user_id, status);
CREATE INDEX IF NOT EXISTS tasks_goal_idx ON tasks (goal_id);
CREATE INDEX IF NOT EXISTS tasks_due_idx ON tasks (user_id, due_at);

-- Finance
CREATE TABLE IF NOT EXISTS budgets (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(120),
  amount_limit NUMERIC(14, 2) NOT NULL CHECK (amount_limit >= 0),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS budgets_user_idx ON budgets (user_id);

CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  budget_id BIGINT REFERENCES budgets (id) ON DELETE SET NULL,
  kind finance_tx_kind NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
  category VARCHAR(120),
  note TEXT,
  occurred_on DATE NOT NULL DEFAULT (CURRENT_DATE),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS transactions_user_idx ON transactions (user_id);
CREATE INDEX IF NOT EXISTS transactions_occurred_idx ON transactions (user_id, occurred_on);

-- Habits
CREATE TABLE IF NOT EXISTS habits (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  color VARCHAR(32) NOT NULL DEFAULT '#6366f1',
  frequency habit_frequency NOT NULL DEFAULT 'daily',
  target_per_week SMALLINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS habits_user_idx ON habits (user_id);

CREATE TABLE IF NOT EXISTS habit_entries (
  id BIGSERIAL PRIMARY KEY,
  habit_id BIGINT NOT NULL REFERENCES habits (id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  count SMALLINT NOT NULL DEFAULT 1 CHECK (count >= 1),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (habit_id, entry_date)
);

CREATE INDEX IF NOT EXISTS habit_entries_habit_idx ON habit_entries (habit_id);

-- Journal
CREATE TABLE IF NOT EXISTS journal_entries (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  mood VARCHAR(64),
  entry_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS journal_entries_user_idx ON journal_entries (user_id);
CREATE INDEX IF NOT EXISTS journal_entries_date_idx ON journal_entries (user_id, entry_date DESC);

-- Notes
CREATE TABLE IF NOT EXISTS notes (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  color VARCHAR(32),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notes_user_idx ON notes (user_id);
CREATE INDEX IF NOT EXISTS notes_user_pinned_idx ON notes (user_id, pinned DESC, updated_at DESC);

-- Calendar
CREATE TABLE IF NOT EXISTS calendar_events (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  location VARCHAR(500),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN NOT NULL DEFAULT FALSE,
  color VARCHAR(32) NOT NULL DEFAULT '#0ea5e9',
  task_id BIGINT REFERENCES tasks (id) ON DELETE SET NULL,
  goal_id BIGINT REFERENCES goals (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ends_at >= starts_at)
);

CREATE INDEX IF NOT EXISTS calendar_events_user_idx ON calendar_events (user_id);
CREATE INDEX IF NOT EXISTS calendar_events_range_idx ON calendar_events (user_id, starts_at, ends_at);

DROP TRIGGER IF EXISTS goals_set_updated_at ON goals;
CREATE TRIGGER goals_set_updated_at
BEFORE UPDATE ON goals
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS milestones_set_updated_at ON milestones;
CREATE TRIGGER milestones_set_updated_at
BEFORE UPDATE ON milestones
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS tasks_set_updated_at ON tasks;
CREATE TRIGGER tasks_set_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS budgets_set_updated_at ON budgets;
CREATE TRIGGER budgets_set_updated_at
BEFORE UPDATE ON budgets
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS habits_set_updated_at ON habits;
CREATE TRIGGER habits_set_updated_at
BEFORE UPDATE ON habits
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS journal_entries_set_updated_at ON journal_entries;
CREATE TRIGGER journal_entries_set_updated_at
BEFORE UPDATE ON journal_entries
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS notes_set_updated_at ON notes;
CREATE TRIGGER notes_set_updated_at
BEFORE UPDATE ON notes
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS calendar_events_set_updated_at ON calendar_events;
CREATE TRIGGER calendar_events_set_updated_at
BEFORE UPDATE ON calendar_events
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
