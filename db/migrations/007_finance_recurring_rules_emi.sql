-- EMI / recurring: optional links + human label. Base table from 005_finance_advanced.sql.

ALTER TABLE recurring_transaction_rules ADD COLUMN IF NOT EXISTS label VARCHAR(200) NOT NULL DEFAULT 'Recurring';
ALTER TABLE recurring_transaction_rules ADD COLUMN IF NOT EXISTS account_id BIGINT REFERENCES finance_accounts (id) ON DELETE SET NULL;
ALTER TABLE recurring_transaction_rules ADD COLUMN IF NOT EXISTS budget_id BIGINT REFERENCES budgets (id) ON DELETE SET NULL;
ALTER TABLE recurring_transaction_rules ADD COLUMN IF NOT EXISTS category_id BIGINT REFERENCES finance_categories (id) ON DELETE SET NULL;
