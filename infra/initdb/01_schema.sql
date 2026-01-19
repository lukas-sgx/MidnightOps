CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  phone_number  TEXT,
  role          TEXT NOT NULL DEFAULT 'user',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE teams (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE team_members (
  id         SERIAL PRIMARY KEY,
  team_id    INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_manager BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (team_id, user_id)
);

CREATE TABLE services (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  team_id     INTEGER REFERENCES teams(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE incidents (
  id               SERIAL PRIMARY KEY,
  title            TEXT NOT NULL,
  description      TEXT,
  status           TEXT NOT NULL DEFAULT 'OPEN',
  severity         INTEGER NOT NULL DEFAULT 3,
  service_id       INTEGER REFERENCES services(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at  TIMESTAMPTZ,
  resolved_at      TIMESTAMPTZ,
  acknowledged_by  INTEGER REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE alerts (
  id              SERIAL PRIMARY KEY,
  incident_id     INTEGER REFERENCES incidents(id) ON DELETE SET NULL,
  source          TEXT NOT NULL,
  message         TEXT,
  severity        INTEGER,
  correlation_key TEXT,
  external_id     TEXT,
  payload         JSONB DEFAULT '{}'::jsonb,
  status          TEXT NOT NULL DEFAULT 'OPEN',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE escalation_policies (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  service_id  INTEGER REFERENCES services(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE escalation_policy_levels (
  id                     SERIAL PRIMARY KEY,
  escalation_policy_id   INTEGER NOT NULL REFERENCES escalation_policies(id) ON DELETE CASCADE,
  level_index            INTEGER NOT NULL,
  delay_minutes          INTEGER NOT NULL,
  user_id                INTEGER REFERENCES users(id) ON DELETE SET NULL,
  team_id                INTEGER REFERENCES teams(id) ON DELETE SET NULL,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (user_id IS NOT NULL AND team_id IS NULL)
    OR (user_id IS NULL AND team_id IS NOT NULL)
  )
);

CREATE TABLE oncall_schedules (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  team_id     INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE oncall_shifts (
  id                SERIAL PRIMARY KEY,
  schedule_id       INTEGER NOT NULL REFERENCES oncall_schedules(id) ON DELETE CASCADE,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  starts_at         TIMESTAMPTZ NOT NULL,
  ends_at           TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ends_at > starts_at)
);

CREATE TABLE notifications (
  id             SERIAL PRIMARY KEY,
  incident_id    INTEGER REFERENCES incidents(id) ON DELETE CASCADE,
  user_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  channel        TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'SENT',
  error_message  TEXT,
  sent_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE incident_notes (
  id           SERIAL PRIMARY KEY,
  incident_id  INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  author_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  body         TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
