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
