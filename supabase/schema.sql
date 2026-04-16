-- ─────────────────────────────────────────────────────
-- Supabase Schema — SaaS Template
-- ─────────────────────────────────────────────────────

CREATE TABLE users (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id             TEXT UNIQUE NOT NULL,
  email                TEXT NOT NULL,
  plan                 TEXT NOT NULL DEFAULT 'usage-based',
  stripe_customer_id   TEXT UNIQUE,
  free_tier_used       BOOLEAN DEFAULT FALSE,
  free_tier_remaining  INTEGER DEFAULT 30,
  created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_sub_id        TEXT UNIQUE NOT NULL,
  stripe_item_id       TEXT NOT NULL,
  status               TEXT NOT NULL DEFAULT 'active',
  current_period_end   TIMESTAMP WITH TIME ZONE,
  created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE usage_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id  TEXT NOT NULL,
  units       DECIMAL NOT NULL,
  metadata    JSONB,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  transcript   JSONB,
  duration_sec INTEGER,
  metadata     JSONB,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX ON usage_logs (user_id, created_at DESC);
CREATE INDEX ON sessions   (user_id, created_at DESC);

ALTER TABLE users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own data" ON users      FOR ALL USING (clerk_id = auth.uid()::text);
CREATE POLICY "own data" ON usage_logs FOR ALL USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::text));
CREATE POLICY "own data" ON sessions   FOR ALL USING (user_id = (SELECT id FROM users WHERE clerk_id = auth.uid()::text));
