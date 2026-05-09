-- Default workspace currency to INR for new finance rows (additive / idempotent)

ALTER TABLE finance_accounts ALTER COLUMN currency SET DEFAULT 'INR';
ALTER TABLE debt_obligations ALTER COLUMN currency SET DEFAULT 'INR';
