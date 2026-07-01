-- M4D Golf League schema
-- Run this against your Railway Postgres instance

CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  ghin_id TEXT,
  handicap_index NUMERIC(4,1) NOT NULL DEFAULT 0,
  handicap_updated_at TIMESTAMPTZ DEFAULT now(),
  is_commish BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  tee_name TEXT NOT NULL,
  round_type TEXT NOT NULL CHECK (round_type IN ('9', '18')),
  slope_rating NUMERIC(5,1) NOT NULL,
  course_rating NUMERIC(4,1) NOT NULL,
  par INTEGER NOT NULL,
  hole_pars INTEGER[] NOT NULL, -- length 9 or 18, matches round_type
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT hole_pars_length CHECK (
    (round_type = '9' AND array_length(hole_pars, 1) = 9) OR
    (round_type = '18' AND array_length(hole_pars, 1) = 18)
  )
);

CREATE TABLE IF NOT EXISTS weeks (
  id SERIAL PRIMARY KEY,
  week_number INTEGER NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rounds (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id),
  week_id INTEGER NOT NULL REFERENCES weeks(id),
  round_type TEXT NOT NULL CHECK (round_type IN ('9', '18')),
  date_played DATE NOT NULL,
  hole_scores INTEGER[] NOT NULL,
  capped_hole_scores INTEGER[] NOT NULL,
  gross_score INTEGER NOT NULL,
  handicap_index_used NUMERIC(4,1) NOT NULL, -- snapshot at time of entry
  course_handicap INTEGER NOT NULL,
  net_score INTEGER NOT NULL,
  stableford_points INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (player_id, week_id, course_id, date_played)
);

CREATE INDEX IF NOT EXISTS idx_rounds_week ON rounds(week_id);
CREATE INDEX IF NOT EXISTS idx_rounds_player ON rounds(player_id);
