-- Seed data for LunarBase

INSERT INTO users (email, password, name) VALUES
('admin@demo.com', '$2b$10$e4dPQpe3XIDluCZCv3b3iu/H/3f816tgim6l5ly5k7pChHG235Dey', 'Mission Control Admin')
ON CONFLICT (email) DO NOTHING;

-- Missions
INSERT INTO missions (name, objective, crew_size, launch_date, landing_date, return_date, status, agency, budget_billions, current_phase) VALUES
('Artemis V Polar Survey', 'Establish permanent south pole habitat and begin water ice extraction', 4, '2026-03-15', '2026-04-02', '2026-05-20', 'planning', 'NASA', 8.5, 'Mission Design Phase'),
('Chang''e 9 Resource Mission', 'Lunar resource prospecting and ISRU demonstration', 0, '2025-11-20', '2025-12-10', NULL, 'launched', 'CNSA', 3.2, 'Trans-Lunar Injection'),
('Lunar Gateway Crew 1', 'First crew rotation to Lunar Gateway station', 4, '2027-06-01', NULL, NULL, 'planning', 'NASA/ESA', 2.1, 'Crew Selection'),
('JAXA Regolith Miner', 'Automated regolith mining demonstration at Mare Imbrium', 0, '2026-08-15', '2026-09-05', NULL, 'planning', 'JAXA', 1.8, 'Instrument Integration'),
('Blue Moon Base Alpha', 'Establish commercial lunar base with 6-person capacity', 6, '2027-02-28', '2027-04-15', NULL, 'planning', 'Blue Origin', 4.5, 'Vehicle Assembly'),
('SpaceX Starship Lunar 2', 'Cargo delivery and 3D printing equipment deployment', 0, '2026-05-10', '2026-06-01', NULL, 'transit', 'SpaceX', 1.2, 'Coast Phase'),
('ESA Lunar ISRU Demo', 'In-Situ Resource Utilization technology demonstration', 0, '2027-04-01', NULL, NULL, 'planning', 'ESA', 2.7, 'PDR Review'),
('Astrobotic Power Station', 'Deploy 50kW nuclear power system at south pole', 0, '2026-11-20', '2026-12-10', NULL, 'planning', 'Astrobotic/NASA', 0.9, 'Launch Preparation'),
('Lunar Farside Observatory', 'Deploy radio telescope array on lunar far side', 2, '2028-01-15', '2028-02-20', '2028-06-01', 'planning', 'NASA/NSF', 3.8, 'Design Phase'),
('ispace Mission 3', 'Commercial resource survey and sample return', 0, '2026-07-01', '2026-08-15', '2026-10-01', 'planning', 'ispace', 0.5, 'Integration'),
('Roscosmos Luna 28', 'Lunar south pole sample return mission', 0, '2027-09-01', NULL, NULL, 'planning', 'Roscosmos', 1.5, 'Development'),
('Korean Lunar Pathfinder 2', 'Resource mapping orbiter + small lander', 0, '2026-12-01', NULL, NULL, 'planning', 'KARI', 0.8, 'PDR'),
('Dynetics HLS Test', 'Human Landing System altitude test over lunar surface', 2, '2027-07-01', '2027-08-01', '2027-10-01', 'planning', 'Dynetics/NASA', 1.9, 'CDR'),
('NASA MOXIE Scale-Up', 'Scale up oxygen production from CO2 to 1kg/hour', 0, '2026-09-15', '2026-10-20', NULL, 'planning', 'NASA', 0.7, 'Hardware Fabrication'),
('Intuitive Machines IM-4', 'Precision landing near Shackleton crater rim', 0, '2026-02-01', '2026-03-01', NULL, 'surface_ops', 'IM', 0.3, 'Surface Operations')
ON CONFLICT DO NOTHING;

-- Bases
INSERT INTO bases (name, location, established_date, power_kw, crew_count, status, coordinates, altitude_m, total_regolith_kg, mission_id) VALUES
('Mare Tranquillitatis Base Alpha', 'Sea of Tranquility, near Apollo 11 site', '2028-06-15', 85.0, 6, 'operational', '0.674°N 23.473°E', -10.0, 45600.0, 1),
('Shackleton Crater Station', 'Shackleton Crater Rim, South Pole', '2029-02-20', 250.0, 4, 'operational', '89.9°S 0°E', 3500.0, 128000.0, 3),
('Aristarchus Highlands Outpost', 'Aristarchus Plateau, near Herodotus Valley', '2029-09-01', 45.0, 2, 'construction', '26.3°N 48.9°W', 2100.0, 8500.0, 6),
('Mare Imbrium Research Station', 'Mare Imbrium Basin', '2027-11-10', 30.0, 0, 'maintenance', '32.8°N 15.6°W', -1700.0, 22000.0, 4),
('Malapert Mountain Peak Base', 'Malapert Mountain, near South Pole', '2030-03-05', 180.0, 3, 'construction', '86.0°S 0°W', 5000.0, 67000.0, 5)
ON CONFLICT DO NOTHING;

-- Mining Operations
INSERT INTO mining_operations (base_id, site_name, method, regolith_kg_per_hour, depth_cm, started_at, ended_at, status, total_extracted_kg, energy_kw_consumed, notes) VALUES
(1, 'Alpha-1 Surface Grid', 'surface_scoop', 450.0, 30, '2028-08-01 06:00:00', NULL, 'active', 38400.0, 12.5, 'Main regolith collection for construction'),
(1, 'Alpha-2 Drill Site', 'subsurface_drill', 120.0, 350, '2028-10-15 08:00:00', NULL, 'active', 7200.0, 45.0, 'Subsurface sampling for water ice detection'),
(2, 'Shackleton Ice Zone 1', 'thermal', 85.0, 80, '2029-04-01 00:00:00', NULL, 'active', 28900.0, 68.0, 'Water ice extraction in permanently shadowed region'),
(2, 'Shackleton Ice Zone 2', 'electrostatic', 45.0, 15, '2029-05-20 12:00:00', NULL, 'active', 9800.0, 22.0, 'Electrostatic separation of fine regolith'),
(2, 'PSR Deep Drill Alpha', 'subsurface_drill', 60.0, 800, '2029-07-10 09:00:00', '2029-09-30 18:00:00', 'completed', 8160.0, 120.0, 'Confirmed water ice at 80cm depth'),
(3, 'Aristarchus Survey A', 'surface_scoop', 380.0, 20, '2029-10-01 10:00:00', NULL, 'paused', 3800.0, 8.0, 'Operations paused for equipment maintenance'),
(4, 'Imbrium Grid B', 'surface_scoop', 520.0, 25, '2027-12-01 07:00:00', '2028-06-30 17:00:00', 'completed', 93600.0, 15.0, 'Main construction material collection complete'),
(4, 'Imbrium Drill-1', 'subsurface_drill', 90.0, 500, '2028-02-15 08:00:00', '2028-08-15 12:00:00', 'completed', 13500.0, 90.0, NULL),
(5, 'Malapert North Grid', 'surface_scoop', 490.0, 28, '2030-04-01 08:00:00', NULL, 'active', 18620.0, 13.0, NULL),
(5, 'Malapert Ice Probe 1', 'thermal', 70.0, 120, '2030-05-15 00:00:00', NULL, 'active', 4200.0, 75.0, 'First polar ice extraction at Malapert'),
(1, 'Alpha-3 Subsurface', 'subsurface_drill', 100.0, 600, '2029-01-20 09:00:00', NULL, 'active', 5500.0, 55.0, NULL),
(2, 'PSR Grid Zone 3', 'electrostatic', 55.0, 20, '2029-08-01 12:00:00', NULL, 'active', 6600.0, 25.0, NULL),
(3, 'Aristarchus Survey B', 'surface_scoop', 420.0, 22, '2030-01-15 08:00:00', NULL, 'active', 12600.0, 11.0, NULL),
(2, 'Shackleton Deep Ice', 'thermal', 95.0, 200, '2029-11-01 00:00:00', NULL, 'active', 7600.0, 80.0, 'Second ice extraction site commissioned'),
(1, 'Alpha Grid South', 'surface_scoop', 400.0, 30, '2029-03-01 06:00:00', '2029-06-30 18:00:00', 'completed', 43200.0, 11.5, 'Seasonal extraction complete')
ON CONFLICT DO NOTHING;

-- Resources
INSERT INTO resources (base_id, resource_type, quantity_kg, purity_pct, extraction_date, storage_location, market_value_per_kg, status) VALUES
(1, 'regolith', 45600.0, 99.0, '2029-01-15', 'Storage Bay A1', 0.5, 'available'),
(1, 'silicon', 1250.0, 94.2, '2029-02-01', 'Processing Unit 1', 45.0, 'processing'),
(1, 'aluminum', 890.0, 91.5, '2029-02-01', 'Processing Unit 2', 120.0, 'available'),
(2, 'water_ice', 12400.0, 88.0, '2029-06-15', 'Cryo Tank A', 8000.0, 'available'),
(2, 'oxygen', 4800.0, 99.9, '2029-07-01', 'Oxygen Tank B1', 2000.0, 'reserved'),
(2, 'water_ice', 5600.0, 92.5, '2029-08-20', 'Cryo Tank B', 8000.0, 'available'),
(2, 'helium3', 0.085, 98.0, '2029-09-10', 'Secure Storage He3-1', 5000000.0, 'reserved'),
(3, 'iron', 2200.0, 87.0, '2029-11-01', 'Bay 3A', 15.0, 'available'),
(3, 'titanium', 450.0, 89.5, '2029-11-15', 'Secure Bay 3B', 350.0, 'available'),
(4, 'silicon', 3400.0, 93.0, '2028-04-01', 'Storage Unit M1', 45.0, 'available'),
(4, 'aluminum', 2100.0, 90.2, '2028-05-15', 'Storage Unit M2', 120.0, 'available'),
(4, 'regolith', 22000.0, 99.0, '2028-06-01', 'Open Storage M', 0.5, 'available'),
(5, 'water_ice', 3200.0, 85.0, '2030-06-01', 'Cryo Tank M1', 8000.0, 'processing'),
(1, 'oxygen', 2100.0, 99.8, '2029-04-01', 'Oxygen Tank A2', 2000.0, 'available'),
(2, 'iron', 780.0, 86.5, '2029-05-01', 'Storage Bay S3', 15.0, 'available')
ON CONFLICT DO NOTHING;

-- Print Jobs
INSERT INTO print_jobs (base_id, structure_name, structure_type, material_used_kg, dimensions, mass_kg, status, started_at, completed_at, success, quality_score, notes) VALUES
(1, 'Habitat Panel Alpha-7', 'habitat_panel', 450.0, '3.0m x 2.5m x 0.3m', 420.0, 'completed', '2028-09-01 08:00:00', '2028-09-08 14:00:00', TRUE, 92, 'Structural integrity verified 98% of Earth-equivalent strength'),
(1, 'Solar Array Mount-1', 'solar_mount', 85.0, '2.0m x 1.5m x 0.2m', 78.0, 'completed', '2028-09-10 10:00:00', '2028-09-12 16:00:00', TRUE, 88, NULL),
(2, 'Shackleton Airlock Frame', 'habitat_panel', 890.0, '4.0m x 3.0m x 0.5m', 860.0, 'completed', '2029-05-01 08:00:00', '2029-05-14 17:00:00', TRUE, 95, 'High pressure rated, dual redundant sealing'),
(2, 'PSR Pressure Vessel Mk2', 'pressure_vessel', 320.0, '1.2m dia x 2.0m', 310.0, 'completed', '2029-06-20 09:00:00', '2029-06-30 15:00:00', TRUE, 90, 'Rated for 2.5 bar internal pressure'),
(1, 'Landing Pad Extension A', 'landing_pad', 2200.0, '20m x 20m x 0.15m', 2100.0, 'completed', '2028-12-01 06:00:00', '2028-12-22 17:00:00', TRUE, 85, 'Supports Starship class vehicle loads'),
(3, 'Aristarchus Antenna Bracket', 'antenna_bracket', 45.0, '0.8m x 0.5m x 0.4m', 42.0, 'completed', '2029-11-15 10:00:00', '2029-11-16 14:00:00', TRUE, 91, NULL),
(2, 'Habitat Panel Beta-1', 'habitat_panel', 480.0, '3.0m x 2.5m x 0.3m', 455.0, 'inspection', '2029-09-01 08:00:00', '2029-09-09 16:00:00', NULL, NULL, 'Awaiting quality inspection'),
(1, 'Emergency Connector A3', 'connector', 8.0, '0.15m x 0.15m x 0.2m', 7.5, 'completed', '2029-03-05 14:00:00', '2029-03-05 18:00:00', TRUE, 96, 'Quick manufacture for airlock repair'),
(5, 'Malapert Solar Mount', 'solar_mount', 95.0, '2.5m x 2.0m x 0.2m', 88.0, 'printing', '2030-06-01 08:00:00', NULL, NULL, NULL, 'First print job at Malapert'),
(4, 'Imbrium Tool Set Alpha', 'tool', 12.0, 'Various', 11.5, 'completed', '2028-03-10 10:00:00', '2028-03-11 12:00:00', TRUE, 88, '12-piece tool set for maintenance'),
(1, 'Comms Tower Base', 'antenna_bracket', 180.0, '1.5m x 1.5m x 3.0m', 172.0, 'completed', '2029-01-20 08:00:00', '2029-01-25 16:00:00', TRUE, 89, NULL),
(2, 'Shackleton Tunnel Section 1', 'habitat_panel', 1200.0, '8.0m x 2.5m x 0.4m', 1150.0, 'completed', '2029-07-15 06:00:00', '2029-08-05 17:00:00', TRUE, 93, 'Underground tunnel connecting habitats'),
(3, 'Pressure Vessel Mk1', 'pressure_vessel', 280.0, '1.0m dia x 1.5m', 268.0, 'failed', '2030-01-20 09:00:00', '2030-01-28 12:00:00', FALSE, 42, 'Delamination failure - material ratio error'),
(5, 'Malapert Habitat Module A', 'habitat_panel', 520.0, '3.5m x 3.0m x 0.35m', 495.0, 'queued', NULL, NULL, NULL, NULL, 'Queued after solar mount completes'),
(1, 'Alpha Base Tool Cache 2', 'tool', 15.0, 'Various', 14.2, 'cooling', '2030-02-01 10:00:00', NULL, NULL, NULL, 'Cooling phase after printing')
ON CONFLICT DO NOTHING;

-- Equipment
INSERT INTO equipment (base_id, name, equipment_type, status, last_maintenance, efficiency_pct, operating_hours, fault_count, next_service_at) VALUES
(1, 'Excavator Unit Alpha-1', 'excavator', 'operational', '2029-10-15 08:00:00', 94, 8400, 2, '2030-04-15 08:00:00'),
(1, 'Regolith Printer MkIII', 'printer', 'operational', '2029-11-01 12:00:00', 88, 4200, 5, '2030-05-01 12:00:00'),
(1, 'Silicon Refinery Unit 1', 'refinery', 'operational', '2029-09-20 09:00:00', 91, 6100, 1, '2030-03-20 09:00:00'),
(1, 'Solar Array Alpha Panel 1-12', 'solar_array', 'operational', '2029-08-01 10:00:00', 96, 13000, 0, '2031-08-01 10:00:00'),
(1, 'Power Storage Alpha Battery Bank', 'power_storage', 'degraded', '2029-07-15 14:00:00', 78, 15200, 8, '2030-01-15 14:00:00'),
(2, 'Excavator Shackleton-1', 'excavator', 'operational', '2029-12-01 06:00:00', 97, 5600, 1, '2030-06-01 06:00:00'),
(2, 'Ice Drill DEEP-1', 'excavator', 'operational', '2029-11-15 09:00:00', 89, 3200, 3, '2030-05-15 09:00:00'),
(2, 'Habitat Printer S-1', 'printer', 'operational', '2029-10-20 10:00:00', 93, 2800, 2, '2030-04-20 10:00:00'),
(2, 'Nuclear Power Unit NPU-1', 'power_storage', 'operational', '2030-01-01 00:00:00', 99, 7800, 0, '2031-01-01 00:00:00'),
(2, 'Rover Shackleton Explorer', 'rover', 'operational', '2029-09-15 12:00:00', 85, 12400, 7, '2030-03-15 12:00:00'),
(3, 'Aristarchus Excavator-1', 'excavator', 'maintenance_required', '2029-09-01 08:00:00', 62, 1800, 4, '2029-09-01 08:00:00'),
(3, 'Aristarchus Solar Panel 1', 'solar_array', 'operational', '2030-01-01 10:00:00', 91, 3200, 1, '2032-01-01 10:00:00'),
(4, 'Imbrium Excavator-1', 'excavator', 'offline', '2028-12-01 09:00:00', 0, 4200, 12, NULL),
(4, 'Imbrium Printer-1', 'printer', 'operational', '2029-06-15 14:00:00', 86, 2100, 3, '2029-12-15 14:00:00'),
(5, 'Malapert Excavator-1', 'excavator', 'operational', '2030-04-15 08:00:00', 99, 800, 0, '2030-10-15 08:00:00')
ON CONFLICT DO NOTHING;
