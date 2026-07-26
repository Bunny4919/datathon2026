-- ============================================================
-- KSP Crime Intelligence Platform
-- Production Schema Migration
-- Target: Catalyst Data Store (PostgreSQL)
-- Purpose: Align the production PostgreSQL schema with the
--          column names used in the backend code (SQLite dev).
-- Run this ONCE before deploying to Catalyst.
-- ============================================================

-- --------------------------------------------------------
-- 1. Add `districts` table (referenced heavily in analytics)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS districts (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    population INTEGER DEFAULT 0
);

-- Seed Karnataka districts
INSERT INTO districts (name, population) VALUES
  ('Bengaluru Urban', 12765000),
  ('Mysuru', 3005000),
  ('Belagavi', 4779000),
  ('Dakshina Kannada', 2089000),
  ('Ballari', 2532000),
  ('Dharwad', 1848000),
  ('Kalaburagi', 2566000),
  ('Shivamogga', 1753000),
  ('Tumakuru', 2678000),
  ('Hassan', 1776000)
ON CONFLICT (name) DO NOTHING;

-- --------------------------------------------------------
-- 2. Rename fir_number → case_number in firs
-- --------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'firs' AND column_name = 'fir_number'
  ) THEN
    ALTER TABLE firs RENAME COLUMN fir_number TO case_number;
  END IF;
END $$;

-- --------------------------------------------------------
-- 3. Add district_id FK to firs (alongside location_id)
--    Code uses district_id in many analytics JOIN queries
-- --------------------------------------------------------
ALTER TABLE firs
  ADD COLUMN IF NOT EXISTS district_id INTEGER REFERENCES districts(id);

-- Back-fill district_id from locations where possible
UPDATE firs f
SET district_id = d.id
FROM locations l
JOIN districts d ON d.name = l.district
WHERE f.location_id = l.id
  AND f.district_id IS NULL;

-- --------------------------------------------------------
-- 4. Add missing columns to accused
-- --------------------------------------------------------
ALTER TABLE accused
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS fir_id  INTEGER REFERENCES firs(id);

-- Back-fill fir_id on accused from fir_accused junction
UPDATE accused a
SET fir_id = fa.fir_id
FROM fir_accused fa
WHERE fa.accused_id = a.id
  AND a.fir_id IS NULL;

-- --------------------------------------------------------
-- 5. Add missing columns to victims
-- --------------------------------------------------------
ALTER TABLE victims
  ADD COLUMN IF NOT EXISTS name    VARCHAR(255),
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS fir_id  INTEGER REFERENCES firs(id);

-- Back-fill fir_id on victims from fir_victims junction
UPDATE victims v
SET fir_id = fv.fir_id
FROM fir_victims fv
WHERE fv.victim_id = v.id
  AND v.fir_id IS NULL;

-- --------------------------------------------------------
-- 6. Add missing columns to locations
-- --------------------------------------------------------
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS name       VARCHAR(100),
  ADD COLUMN IF NOT EXISTS district_id INTEGER REFERENCES districts(id);

-- Back-fill name and district_id from the district string column
UPDATE locations l
SET
  name       = l.station,
  district_id = d.id
FROM districts d
WHERE d.name = l.district
  AND l.name IS NULL;

-- --------------------------------------------------------
-- 7. Align district_indicators with code expectations
-- --------------------------------------------------------
ALTER TABLE district_indicators
  ADD COLUMN IF NOT EXISTS district_id   INTEGER REFERENCES districts(id),
  ADD COLUMN IF NOT EXISTS unemployment_rate DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS literacy_rate     DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS poverty_index     DECIMAL(5,2);

-- Back-fill from existing columns
UPDATE district_indicators di
SET
  district_id        = d.id,
  unemployment_rate  = di.unemployment_index,
  literacy_rate      = di.literacy_rate,
  poverty_index      = (1.0 - di.literacy_rate / 100.0)  -- proxy
FROM districts d
WHERE d.name = di.district
  AND di.district_id IS NULL;

-- --------------------------------------------------------
-- 8. Align financial_transactions with code expectations
-- --------------------------------------------------------
ALTER TABLE financial_transactions
  ADD COLUMN IF NOT EXISTS source_account      VARCHAR(100),
  ADD COLUMN IF NOT EXISTS destination_account VARCHAR(100),
  ADD COLUMN IF NOT EXISTS fir_id              INTEGER REFERENCES firs(id);

-- Back-fill source_account from account_number
UPDATE financial_transactions
SET source_account = account_number
WHERE source_account IS NULL AND account_number IS NOT NULL;

-- --------------------------------------------------------
-- 9. Rename crime_stats table to historical_crime_stats alias
--    (code uses both names depending on file)
-- --------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'crime_stats'
  ) THEN
    CREATE VIEW crime_stats AS SELECT * FROM historical_crime_stats;
  END IF;
END $$;

-- Add district_id to historical_crime_stats
ALTER TABLE historical_crime_stats
  ADD COLUMN IF NOT EXISTS district_id INTEGER REFERENCES districts(id);

UPDATE historical_crime_stats hcs
SET district_id = d.id
FROM districts d
WHERE d.name = hcs.district
  AND hcs.district_id IS NULL;

-- --------------------------------------------------------
-- 10. Add unique constraint for cron upsert
-- --------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_crime_stats_district_type_month_year'
  ) THEN
    ALTER TABLE historical_crime_stats
      ADD CONSTRAINT uq_crime_stats_district_type_month_year
      UNIQUE (district, crime_type, month, year);
  END IF;
END $$;

-- --------------------------------------------------------
-- 11. Refresh performance indexes
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_accused_fir_id       ON accused(fir_id);
CREATE INDEX IF NOT EXISTS idx_victims_fir_id        ON victims(fir_id);
CREATE INDEX IF NOT EXISTS idx_firs_district_id      ON firs(district_id);
CREATE INDEX IF NOT EXISTS idx_locations_district_id ON locations(district_id);
CREATE INDEX IF NOT EXISTS idx_hcs_district_id       ON historical_crime_stats(district_id);
CREATE INDEX IF NOT EXISTS idx_fintx_accused_id      ON financial_transactions(accused_id);
CREATE INDEX IF NOT EXISTS idx_chat_session_id       ON chat_sessions(session_id);

-- ============================================================
-- Migration complete. Run seed_db.py next.
-- ============================================================
