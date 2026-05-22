-- LunarBase Schema

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS missions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  objective TEXT,
  crew_size INTEGER,
  launch_date DATE,
  landing_date DATE,
  return_date DATE,
  status VARCHAR(30),
  agency VARCHAR(100),
  budget_billions DECIMAL,
  current_phase VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS bases (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  established_date DATE,
  power_kw DECIMAL,
  crew_count INTEGER,
  status VARCHAR(30),
  coordinates TEXT,
  altitude_m DECIMAL,
  total_regolith_kg DECIMAL DEFAULT 0,
  mission_id INT REFERENCES missions(id)
);

CREATE TABLE IF NOT EXISTS mining_operations (
  id SERIAL PRIMARY KEY,
  base_id INT REFERENCES bases(id),
  site_name VARCHAR(255),
  method VARCHAR(50),
  regolith_kg_per_hour DECIMAL,
  depth_cm INTEGER,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  status VARCHAR(30),
  total_extracted_kg DECIMAL DEFAULT 0,
  energy_kw_consumed DECIMAL DEFAULT 0,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS resources (
  id SERIAL PRIMARY KEY,
  base_id INT REFERENCES bases(id),
  resource_type VARCHAR(50),
  quantity_kg DECIMAL,
  purity_pct DECIMAL,
  extraction_date DATE,
  storage_location VARCHAR(100),
  market_value_per_kg DECIMAL,
  status VARCHAR(30)
);

CREATE TABLE IF NOT EXISTS print_jobs (
  id SERIAL PRIMARY KEY,
  base_id INT REFERENCES bases(id),
  structure_name VARCHAR(255),
  structure_type VARCHAR(50),
  material_used_kg DECIMAL,
  dimensions TEXT,
  mass_kg DECIMAL,
  status VARCHAR(30),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  success BOOLEAN,
  quality_score INTEGER,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS equipment (
  id SERIAL PRIMARY KEY,
  base_id INT REFERENCES bases(id),
  name VARCHAR(255) NOT NULL,
  equipment_type VARCHAR(50),
  status VARCHAR(30),
  last_maintenance TIMESTAMP,
  efficiency_pct INTEGER,
  operating_hours INTEGER DEFAULT 0,
  fault_count INTEGER DEFAULT 0,
  next_service_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  user_email VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id VARCHAR(50),
  details TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit-implementation feature tables (2026-05-14)
-- Real space-industrial platforms (Varda capsules, Starlab, Orbital Reef, Vast Haven-1, Made In Space AMF...)
CREATE TABLE IF NOT EXISTS orbital_platforms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  operator VARCHAR(255),
  platform_type VARCHAR(80),   -- free_flyer, station, hosted_payload, capsule
  orbit VARCHAR(80),           -- LEO, SSO, GEO, ISS
  altitude_km INTEGER,
  inclination_deg DECIMAL,
  mass_kg DECIMAL,
  power_kw DECIMAL,
  pressurized_volume_m3 DECIMAL,
  microgravity_class VARCHAR(20),
  launch_year INTEGER,
  status VARCHAR(30),          -- operational, in_development, retired, planned
  notes TEXT
);

CREATE TABLE IF NOT EXISTS manufacturing_batches (
  id SERIAL PRIMARY KEY,
  platform_id INT REFERENCES orbital_platforms(id),
  product_name VARCHAR(255),
  product_family VARCHAR(80),  -- ZBLAN, protein_crystal, retina_chip, semiconductor_crystal, alloy, pharma
  batch_code VARCHAR(60),
  mass_g DECIMAL,
  yield_pct DECIMAL,
  earth_value_per_g DECIMAL,
  process_start TIMESTAMP,
  process_end TIMESTAMP,
  returned_to_earth BOOLEAN DEFAULT FALSE,
  return_method VARCHAR(80),   -- Dragon, Varda capsule, Starliner, Soyuz
  defects INTEGER DEFAULT 0,
  status VARCHAR(30),
  notes TEXT
);

-- In-Situ Resource Utilization sites + production logs (lunar polar ice, Mars CO2->O2, regolith)
CREATE TABLE IF NOT EXISTS isru_sites (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  body VARCHAR(30),            -- Moon, Mars, Asteroid
  region VARCHAR(120),
  feedstock VARCHAR(60),       -- water_ice, regolith, CO2, basalt
  process VARCHAR(80),         -- thermal_extraction, electrolysis, SOXE (MOXIE), pyrolysis
  capacity_kg_per_day DECIMAL,
  power_required_kw DECIMAL,
  operator VARCHAR(120),
  commissioning_year INTEGER,
  status VARCHAR(30)
);

CREATE TABLE IF NOT EXISTS isru_production_runs (
  id SERIAL PRIMARY KEY,
  site_id INT REFERENCES isru_sites(id),
  output_product VARCHAR(60),  -- O2, H2O, H2, Si, Al, Fe, Ti
  output_kg DECIMAL,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  energy_kwh DECIMAL,
  purity_pct DECIMAL,
  yield_pct DECIMAL,
  notes TEXT
);

-- Real launch vehicles (Falcon 9, Falcon Heavy, Starship, Electron, Vulcan, Neutron, New Glenn)
CREATE TABLE IF NOT EXISTS launch_vehicles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  operator VARCHAR(120),
  payload_leo_kg INTEGER,
  payload_gto_kg INTEGER,
  payload_tli_kg INTEGER,         -- Trans-Lunar Injection
  cost_per_launch_millions DECIMAL,
  cost_per_kg_leo DECIMAL,
  reusable BOOLEAN,
  status VARCHAR(30),             -- active, retired, in_development
  first_flight_year INTEGER,
  fairing_diameter_m DECIMAL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS launch_manifests (
  id SERIAL PRIMARY KEY,
  vehicle_id INT REFERENCES launch_vehicles(id),
  flight_number VARCHAR(40),
  launch_date DATE,
  payload_name VARCHAR(255),
  customer VARCHAR(120),
  payload_mass_kg DECIMAL,
  destination VARCHAR(60),        -- LEO, SSO, GTO, TLI, ISS, lunar_surface
  contract_value_millions DECIMAL,
  status VARCHAR(30)              -- success, partial, failure, scheduled
);

-- Microgravity-advantage products catalog (ZBLAN, retina chips, protein crystals, InP crystals, exotic alloys)
CREATE TABLE IF NOT EXISTS microgravity_products (
  id SERIAL PRIMARY KEY,
  product_name VARCHAR(255),
  category VARCHAR(80),
  microgravity_advantage TEXT,
  earth_market_size_millions DECIMAL,
  unit_price_usd DECIMAL,
  unit VARCHAR(40),
  trl INTEGER,                    -- Technology Readiness Level 1-9
  primary_developer VARCHAR(160),
  earth_equivalent_quality_pct DECIMAL,
  microgravity_quality_pct DECIMAL,
  notes TEXT
);

-- On-orbit servicing missions (Northrop MEV-1/2, Astroscale ELSA-d, Maxar OSAM-1)
CREATE TABLE IF NOT EXISTS servicing_missions (
  id SERIAL PRIMARY KEY,
  mission_name VARCHAR(160),
  servicer_spacecraft VARCHAR(160),
  client_spacecraft VARCHAR(160),
  operator VARCHAR(120),
  service_type VARCHAR(80),       -- life_extension, refuel, repair, deorbit, inspection, assembly
  orbit VARCHAR(40),
  rendezvous_date DATE,
  service_end_date DATE,
  contract_value_millions DECIMAL,
  status VARCHAR(30),             -- planned, in_progress, completed, failed
  client_value_extended_years DECIMAL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS rendezvous_events (
  id SERIAL PRIMARY KEY,
  mission_id INT REFERENCES servicing_missions(id),
  event_time TIMESTAMP,
  event_type VARCHAR(60),         -- approach, capture, undock, maneuver, anomaly
  range_m DECIMAL,
  relative_velocity_mps DECIMAL,
  delta_v_mps DECIMAL,
  notes TEXT
);

-- Apply pass 7 (2026-05-21): codify the lazily-created table used by every
-- cf-* / gap-* audit-feature route. Each route also runs CREATE TABLE IF NOT
-- EXISTS at request time; this entry just brings the schema dump into sync.
CREATE TABLE IF NOT EXISTS gap_features (
  id SERIAL PRIMARY KEY,
  feature_slug TEXT NOT NULL,
  user_id INTEGER,
  input JSONB,
  output TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS gap_features_slug_idx ON gap_features (feature_slug, created_at DESC);
