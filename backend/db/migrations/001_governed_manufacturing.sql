ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'OPERATOR';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
UPDATE users SET role='ADMIN' WHERE email='admin@demo.com';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='users_role_check') THEN
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('OPERATOR','QUALITY','APPROVER','ADMIN'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS user_base_access (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  base_id INTEGER NOT NULL REFERENCES bases(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, base_id)
);

CREATE TABLE IF NOT EXISTS material_lots (
  id BIGSERIAL PRIMARY KEY,
  base_id INTEGER NOT NULL REFERENCES bases(id),
  lot_code VARCHAR(80) NOT NULL,
  material_type VARCHAR(60) NOT NULL,
  quantity_received_kg NUMERIC(14,3) NOT NULL CHECK (quantity_received_kg > 0),
  quantity_available_kg NUMERIC(14,3) NOT NULL CHECK (quantity_available_kg >= 0 AND quantity_available_kg <= quantity_received_kg),
  purity_pct NUMERIC(6,3) NOT NULL CHECK (purity_pct >= 0 AND purity_pct <= 100),
  status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE','QUARANTINED','DEPLETED','REJECTED')),
  storage_location VARCHAR(120) NOT NULL,
  source_system VARCHAR(80) NOT NULL,
  source_record_id VARCHAR(120) NOT NULL,
  external_event_id VARCHAR(128) NOT NULL UNIQUE,
  certificate_url TEXT NOT NULL,
  ingest_hash CHAR(64) NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  retention_until TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 years'),
  received_at TIMESTAMPTZ NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (base_id, lot_code),
  UNIQUE (source_system, source_record_id)
);
CREATE INDEX IF NOT EXISTS material_lots_base_status_idx ON material_lots(base_id, status, id DESC);

CREATE TABLE IF NOT EXISTS manufacturing_work_orders (
  id BIGSERIAL PRIMARY KEY,
  base_id INTEGER NOT NULL REFERENCES bases(id),
  work_order_code VARCHAR(80) NOT NULL,
  part_number VARCHAR(100) NOT NULL,
  revision VARCHAR(30) NOT NULL,
  description TEXT NOT NULL,
  required_material_type VARCHAR(60) NOT NULL,
  material_required_kg NUMERIC(14,3) NOT NULL CHECK (material_required_kg > 0),
  min_purity_pct NUMERIC(6,3) NOT NULL CHECK (min_purity_pct >= 0 AND min_purity_pct <= 100),
  expected_mass_kg NUMERIC(14,3) NOT NULL CHECK (expected_mass_kg > 0),
  mass_tolerance_pct NUMERIC(5,2) NOT NULL CHECK (mass_tolerance_pct > 0 AND mass_tolerance_pct <= 10),
  temperature_min_c NUMERIC(8,2) NOT NULL,
  temperature_max_c NUMERIC(8,2) NOT NULL,
  max_vibration_mm_s NUMERIC(8,3) NOT NULL CHECK (max_vibration_mm_s > 0),
  status VARCHAR(30) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','RELEASED','MATERIAL_RESERVED','IN_PROGRESS','AWAITING_INSPECTION','AWAITING_APPROVAL','APPROVED','REJECTED','CANCELLED')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by INTEGER NOT NULL REFERENCES users(id),
  approved_by INTEGER REFERENCES users(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  retention_until TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 years'),
  legal_hold BOOLEAN NOT NULL DEFAULT FALSE,
  legal_hold_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (base_id, work_order_code),
  CHECK (temperature_min_c < temperature_max_c),
  CHECK ((legal_hold = FALSE AND legal_hold_reason IS NULL) OR (legal_hold = TRUE AND length(legal_hold_reason) >= 20))
);
CREATE INDEX IF NOT EXISTS manufacturing_work_orders_base_status_idx ON manufacturing_work_orders(base_id, status, id DESC);

CREATE TABLE IF NOT EXISTS work_order_material_allocations (
  id BIGSERIAL PRIMARY KEY,
  work_order_id BIGINT NOT NULL REFERENCES manufacturing_work_orders(id),
  material_lot_id BIGINT NOT NULL REFERENCES material_lots(id),
  reserved_kg NUMERIC(14,3) NOT NULL CHECK (reserved_kg > 0),
  consumed_kg NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (consumed_kg >= 0 AND consumed_kg <= reserved_kg),
  disposition VARCHAR(20) NOT NULL DEFAULT 'RESERVED' CHECK (disposition IN ('RESERVED','CONSUMED','RELEASED')),
  reserved_by INTEGER NOT NULL REFERENCES users(id),
  reserved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (work_order_id, material_lot_id)
);

CREATE TABLE IF NOT EXISTS manufacturing_telemetry_events (
  id BIGSERIAL PRIMARY KEY,
  work_order_id BIGINT NOT NULL REFERENCES manufacturing_work_orders(id),
  external_event_id VARCHAR(128) NOT NULL UNIQUE,
  source_system VARCHAR(80) NOT NULL,
  metric VARCHAR(60) NOT NULL,
  numeric_value NUMERIC(18,6) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_late BOOLEAN NOT NULL DEFAULT FALSE,
  payload_hash CHAR(64) NOT NULL,
  recorded_by INTEGER NOT NULL REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS manufacturing_telemetry_work_order_idx ON manufacturing_telemetry_events(work_order_id, captured_at, id);

CREATE TABLE IF NOT EXISTS work_order_inspections (
  id BIGSERIAL PRIMARY KEY,
  work_order_id BIGINT NOT NULL REFERENCES manufacturing_work_orders(id),
  work_order_version INTEGER NOT NULL,
  quality_score INTEGER NOT NULL CHECK (quality_score BETWEEN 0 AND 100),
  measured_mass_kg NUMERIC(14,3) NOT NULL CHECK (measured_mass_kg > 0),
  dimensional_variance_pct NUMERIC(7,3) NOT NULL CHECK (dimensional_variance_pct >= 0),
  defect_count INTEGER NOT NULL CHECK (defect_count >= 0),
  findings TEXT NOT NULL,
  evidence_url TEXT NOT NULL,
  rules JSONB NOT NULL,
  blockers TEXT[] NOT NULL DEFAULT '{}',
  submitted_by INTEGER NOT NULL REFERENCES users(id),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decision VARCHAR(20) CHECK (decision IN ('APPROVE','REJECT','OVERRIDE')),
  decision_reason TEXT,
  decided_by INTEGER REFERENCES users(id),
  decided_at TIMESTAMPTZ,
  UNIQUE (work_order_id, work_order_version)
);

CREATE TABLE IF NOT EXISTS manufacturing_change_orders (
  id BIGSERIAL PRIMARY KEY,
  work_order_id BIGINT NOT NULL REFERENCES manufacturing_work_orders(id),
  base_version INTEGER NOT NULL,
  reason TEXT NOT NULL,
  impact_assessment TEXT NOT NULL,
  requested_patch JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  requested_by INTEGER NOT NULL REFERENCES users(id),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decision_reason TEXT,
  decided_by INTEGER REFERENCES users(id),
  decided_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS manufacturing_change_orders_one_pending_idx
  ON manufacturing_change_orders(work_order_id) WHERE status='PENDING';

CREATE TABLE IF NOT EXISTS manufacturing_events (
  id BIGSERIAL PRIMARY KEY,
  base_id INTEGER NOT NULL REFERENCES bases(id),
  work_order_id BIGINT REFERENCES manufacturing_work_orders(id),
  actor_id INTEGER REFERENCES users(id),
  action VARCHAR(80) NOT NULL,
  from_status VARCHAR(30),
  to_status VARCHAR(30),
  payload JSONB NOT NULL DEFAULT '{}',
  previous_hash CHAR(64),
  event_hash CHAR(64) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS manufacturing_events_base_idx ON manufacturing_events(base_id, id);
CREATE INDEX IF NOT EXISTS manufacturing_events_work_order_idx ON manufacturing_events(work_order_id, id);

CREATE TABLE IF NOT EXISTS manufacturing_work_order_versions (
  id BIGSERIAL PRIMARY KEY,
  work_order_id BIGINT NOT NULL REFERENCES manufacturing_work_orders(id),
  version INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  provenance JSONB NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(work_order_id, version)
);

CREATE OR REPLACE FUNCTION reject_manufacturing_evidence_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION '% is append-only', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS manufacturing_events_immutable ON manufacturing_events;
CREATE TRIGGER manufacturing_events_immutable BEFORE UPDATE OR DELETE ON manufacturing_events
  FOR EACH ROW EXECUTE FUNCTION reject_manufacturing_evidence_mutation();
DROP TRIGGER IF EXISTS manufacturing_versions_immutable ON manufacturing_work_order_versions;
CREATE TRIGGER manufacturing_versions_immutable BEFORE UPDATE OR DELETE ON manufacturing_work_order_versions
  FOR EACH ROW EXECUTE FUNCTION reject_manufacturing_evidence_mutation();
DROP TRIGGER IF EXISTS manufacturing_telemetry_immutable ON manufacturing_telemetry_events;
CREATE TRIGGER manufacturing_telemetry_immutable BEFORE UPDATE OR DELETE ON manufacturing_telemetry_events
  FOR EACH ROW EXECUTE FUNCTION reject_manufacturing_evidence_mutation();

CREATE OR REPLACE FUNCTION protect_material_lot() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'material lots are retained'; END IF;
  IF NEW.retention_until < OLD.retention_until THEN RAISE EXCEPTION 'material-lot retention cannot be shortened'; END IF;
  IF NEW.version <> OLD.version + 1 THEN RAISE EXCEPTION 'material-lot version must increment exactly once'; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS material_lots_governed ON material_lots;
CREATE TRIGGER material_lots_governed BEFORE UPDATE OR DELETE ON material_lots
  FOR EACH ROW EXECUTE FUNCTION protect_material_lot();

CREATE OR REPLACE FUNCTION enforce_manufacturing_retention() RETURNS trigger AS $$
BEGIN
  IF OLD.legal_hold OR OLD.retention_until > NOW() THEN
    RAISE EXCEPTION 'work order is subject to retention or legal hold';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS manufacturing_work_orders_retained ON manufacturing_work_orders;
CREATE TRIGGER manufacturing_work_orders_retained BEFORE DELETE ON manufacturing_work_orders
  FOR EACH ROW EXECUTE FUNCTION enforce_manufacturing_retention();

CREATE OR REPLACE FUNCTION protect_manufacturing_governance() RETURNS trigger AS $$
BEGIN
  IF NEW.retention_until < OLD.retention_until THEN RAISE EXCEPTION 'retention cannot be shortened'; END IF;
  IF OLD.legal_hold AND NOT NEW.legal_hold THEN RAISE EXCEPTION 'legal hold release requires a privileged external procedure'; END IF;
  IF NEW.version <> OLD.version + 1 THEN RAISE EXCEPTION 'work order version must increment exactly once'; END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS manufacturing_work_orders_governed ON manufacturing_work_orders;
CREATE TRIGGER manufacturing_work_orders_governed BEFORE UPDATE ON manufacturing_work_orders
  FOR EACH ROW EXECUTE FUNCTION protect_manufacturing_governance();

CREATE OR REPLACE FUNCTION protect_decided_inspection() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'inspection records cannot be deleted'; END IF;
  IF OLD.decided_at IS NOT NULL THEN RAISE EXCEPTION 'decided inspection is immutable'; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS decided_inspection_immutable ON work_order_inspections;
CREATE TRIGGER decided_inspection_immutable BEFORE UPDATE OR DELETE ON work_order_inspections
  FOR EACH ROW EXECUTE FUNCTION protect_decided_inspection();
