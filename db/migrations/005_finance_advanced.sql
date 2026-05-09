-- Advanced finance domain: accounts, categories, debt, transaction metadata (additive / idempotent)

CREATE TABLE IF NOT EXISTS finance_accounts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  kind VARCHAR(32) NOT NULL DEFAULT 'cash',
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS finance_accounts_user_idx ON finance_accounts (user_id);

CREATE TABLE IF NOT EXISTS finance_categories (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  kind VARCHAR(16) NOT NULL DEFAULT 'expense',
  parent_id BIGINT REFERENCES finance_categories (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS finance_categories_user_idx ON finance_categories (user_id);

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS account_id BIGINT REFERENCES finance_accounts (id) ON DELETE SET NULL;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS category_id BIGINT REFERENCES finance_categories (id) ON DELETE SET NULL;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS merchant VARCHAR(200);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(64);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS transactions_user_occurred_desc_idx ON transactions (user_id, occurred_on DESC);

CREATE TABLE IF NOT EXISTS debt_obligations (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  counterparty VARCHAR(200) NOT NULL,
  direction VARCHAR(16) NOT NULL,
  principal NUMERIC(14, 2) NOT NULL,
  balance NUMERIC(14, 2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  due_date DATE,
  status VARCHAR(24) NOT NULL DEFAULT 'open',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS debt_obligations_user_idx ON debt_obligations (user_id);
CREATE INDEX IF NOT EXISTS debt_obligations_due_idx ON debt_obligations (user_id, due_date);

CREATE TABLE IF NOT EXISTS debt_payments (
  id BIGSERIAL PRIMARY KEY,
  obligation_id BIGINT NOT NULL REFERENCES debt_obligations (id) ON DELETE CASCADE,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT
);

CREATE INDEX IF NOT EXISTS debt_payments_obligation_idx ON debt_payments (obligation_id);

CREATE TABLE IF NOT EXISTS recurring_transaction_rules (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  template_kind finance_tx_kind NOT NULL,
  template_amount NUMERIC(14, 2) NOT NULL,
  template_category VARCHAR(120),
  cadence VARCHAR(24) NOT NULL DEFAULT 'monthly',
  next_run_on DATE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS recurring_rules_user_idx ON recurring_transaction_rules (user_id);
