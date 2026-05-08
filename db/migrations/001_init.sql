-- Planner enterprise auth schema (PostgreSQL)
-- Requires: gen_random_uuid() (PG13+)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_account_status AS ENUM (
  'active',
  'suspended',
  'locked',
  'pending_verification',
  'deleted'
);

CREATE TYPE otp_channel AS ENUM ('email', 'sms');
CREATE TYPE otp_purpose AS ENUM (
  'login',
  'email_verification',
  'password_reset',
  'phone_verification',
  'two_factor'
);

CREATE TYPE audit_type AS ENUM (
  'auth',
  'security',
  'compliance',
  'api',
  'admin',
  'system'
);

CREATE TYPE audit_severity AS ENUM (
  'debug',
  'info',
  'warning',
  'error',
  'critical'
);

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  public_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  username VARCHAR(64) NOT NULL UNIQUE,
  email VARCHAR(320) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  email_verified_at TIMESTAMPTZ,
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  phone_verified_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  password_changed_at TIMESTAMPTZ,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  backup_codes TEXT,
  account_status user_account_status NOT NULL DEFAULT 'pending_verification',
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by BIGINT REFERENCES users (id),
  updated_by BIGINT REFERENCES users (id),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE TABLE user_profiles (
  user_id BIGINT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  first_name VARCHAR(120),
  middle_name VARCHAR(120),
  last_name VARCHAR(120),
  avatar TEXT,
  bio TEXT,
  phone_number VARCHAR(32),
  alternate_phone VARCHAR(32),
  gender VARCHAR(32),
  dob DATE,
  marital_status VARCHAR(64),
  designation VARCHAR(255),
  department VARCHAR(255),
  company VARCHAR(255),
  experience_years NUMERIC(5, 2),
  skills JSONB NOT NULL DEFAULT '[]'::JSONB,
  preferences JSONB NOT NULL DEFAULT '{}'::JSONB,
  country VARCHAR(120),
  state VARCHAR(120),
  city VARCHAR(120),
  pincode VARCHAR(32),
  address_line_1 TEXT,
  address_line_2 TEXT,
  timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
  locale VARCHAR(32) NOT NULL DEFAULT 'en',
  theme VARCHAR(32) NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE roles (
  id BIGSERIAL PRIMARY KEY,
  slug VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_roles (
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  role_id BIGINT NOT NULL REFERENCES roles (id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by BIGINT REFERENCES users (id),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  device_id VARCHAR(128),
  user_agent TEXT,
  ip_address INET,
  device_type VARCHAR(64),
  platform VARCHAR(64),
  browser VARCHAR(64),
  os VARCHAR(64),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX sessions_user_idx ON sessions (user_id);
CREATE INDEX sessions_expires_idx ON sessions (expires_at);

CREATE TABLE refresh_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions (id) ON DELETE CASCADE,
  token_hash VARCHAR(128) NOT NULL UNIQUE,
  family_id UUID NOT NULL DEFAULT gen_random_uuid(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  replaced_by_id BIGINT REFERENCES refresh_tokens (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX refresh_tokens_user_idx ON refresh_tokens (user_id);
CREATE INDEX refresh_tokens_session_idx ON refresh_tokens (session_id);
CREATE INDEX refresh_tokens_family_idx ON refresh_tokens (family_id);

CREATE TABLE otps (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users (id) ON DELETE CASCADE,
  channel otp_channel NOT NULL,
  destination VARCHAR(320) NOT NULL,
  code_hash VARCHAR(128) NOT NULL,
  type VARCHAR(32) NOT NULL DEFAULT 'numeric',
  purpose otp_purpose NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  resend_after TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX otps_user_purpose_idx ON otps (user_id, purpose);
CREATE INDEX otps_destination_idx ON otps (destination);

CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  request_id VARCHAR(64) NOT NULL,
  trace_id VARCHAR(64),
  user_id BIGINT REFERENCES users (id),
  session_id UUID REFERENCES sessions (id),
  action VARCHAR(128) NOT NULL,
  module VARCHAR(64) NOT NULL,
  entity_type VARCHAR(64),
  entity_id VARCHAR(128),
  endpoint TEXT NOT NULL,
  method VARCHAR(16) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  device_type VARCHAR(64),
  platform VARCHAR(64),
  browser VARCHAR(64),
  os VARCHAR(64),
  request_headers JSONB,
  request_body JSONB,
  response_body JSONB,
  response_status INTEGER,
  error_stack TEXT,
  execution_time_ms INTEGER,
  geo_location JSONB,
  country VARCHAR(120),
  city VARCHAR(120),
  risk_score NUMERIC(6, 2),
  severity audit_severity NOT NULL DEFAULT 'info',
  audit_type audit_type NOT NULL DEFAULT 'api',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX audit_logs_request_idx ON audit_logs (request_id);
CREATE INDEX audit_logs_user_idx ON audit_logs (user_id);
CREATE INDEX audit_logs_created_idx ON audit_logs (created_at);

CREATE TABLE login_history (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users (id) ON DELETE SET NULL,
  session_id UUID REFERENCES sessions (id) ON DELETE SET NULL,
  success BOOLEAN NOT NULL,
  failure_reason VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX login_history_user_idx ON login_history (user_id);

CREATE TABLE access_token_revocations (
  jti VARCHAR(128) PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions (id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX access_token_revocations_expires_idx ON access_token_revocations (expires_at);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER user_profiles_set_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
