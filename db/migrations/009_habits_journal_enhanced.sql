-- Enhanced habits & journal: richer fields, analytics indexes, streak-friendly queries (additive / idempotent)

-- ─── HABITS ────────────────────────────────────────────────────────────────────

ALTER TABLE habits ADD COLUMN IF NOT EXISTS icon VARCHAR(64) NOT NULL DEFAULT '🎯';
ALTER TABLE habits ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS reminder_time TIME;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS start_date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS goal_id BIGINT REFERENCES goals(id) ON DELETE SET NULL;
-- custom_days: array of ISO weekday indices 0=Sun..6=Sat for 'custom' frequency
ALTER TABLE habits ADD COLUMN IF NOT EXISTS custom_days SMALLINT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS habits_user_archived_idx ON habits (user_id, archived);
CREATE INDEX IF NOT EXISTS habits_goal_idx ON habits (goal_id);

-- Faster streak queries: entries ordered by date per habit
CREATE INDEX IF NOT EXISTS habit_entries_habit_date_idx ON habit_entries (habit_id, entry_date DESC);

-- ─── JOURNAL ───────────────────────────────────────────────────────────────────

ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS word_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS prompt TEXT;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS energy_level SMALLINT CHECK (energy_level IS NULL OR (energy_level >= 1 AND energy_level <= 5));
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS weather VARCHAR(64);
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS location VARCHAR(500);

CREATE INDEX IF NOT EXISTS journal_entries_user_mood_idx ON journal_entries (user_id, mood);
CREATE INDEX IF NOT EXISTS journal_entries_user_fav_idx ON journal_entries (user_id, is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX IF NOT EXISTS journal_entries_user_date_desc_idx ON journal_entries (user_id, entry_date DESC);
