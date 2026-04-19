CREATE TABLE IF NOT EXISTS mission2_sessions (
  session_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hidden_truth    TEXT NOT NULL,
  secret_code     TEXT NOT NULL,
  full_suspect    JSONB NOT NULL,
  clearance_level INT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ DEFAULT NOW() + INTERVAL '2 hours'
);

ALTER TABLE mission2_sessions ENABLE ROW LEVEL SECURITY;
