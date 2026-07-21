-- Seed data for LunarBase

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

-- ===== Audit-implementation seeds (2026-05-14) =====

-- Real orbital industrial platforms (Varda, Made In Space ZBLAN, Starlab, Orbital Reef, Vast Haven-1, Axiom...)
INSERT INTO orbital_platforms (name, operator, platform_type, orbit, altitude_km, inclination_deg, mass_kg, power_kw, pressurized_volume_m3, microgravity_class, launch_year, status, notes) VALUES
('Varda W-1', 'Varda Space Industries', 'free_flyer', 'LEO', 525, 97.4, 90, 0.5, 0, '1e-4', 2023, 'completed', 'First commercial in-space pharma capsule; ritonavir crystals returned Feb 2024'),
('Varda W-2', 'Varda Space Industries', 'free_flyer', 'LEO', 525, 97.4, 120, 0.6, 0, '1e-4', 2025, 'operational', 'Second hypersonic re-entry capsule, expanded payload bay'),
('Varda W-3', 'Varda Space Industries', 'free_flyer', 'LEO', 525, 97.4, 120, 0.6, 0, '1e-4', 2026, 'operational', 'DoD hypersonic test bed + pharma payload'),
('Made In Space AMF', 'Redwire (formerly Made In Space)', 'hosted_payload', 'ISS', 420, 51.64, 35, 0.4, 0, '1e-5', 2016, 'operational', 'Additive Manufacturing Facility on ISS; commercial polymer 3D printing'),
('Made In Space ZBLAN', 'Redwire', 'hosted_payload', 'ISS', 420, 51.64, 18, 0.2, 0, '1e-5', 2017, 'operational', 'ZBLAN fluoride optical fiber pulling experiment'),
('Turbine Ceramic MFG', 'Redwire / NASA', 'hosted_payload', 'ISS', 420, 51.64, 22, 0.3, 0, '1e-5', 2020, 'operational', 'Ceramic stereolithography for turbine blades'),
('Industrial Crystallization Facility', 'Redwire', 'hosted_payload', 'ISS', 420, 51.64, 18, 0.25, 0, '1e-5', 2024, 'operational', 'Pharma protein crystal growth at scale'),
('Starlab', 'Voyager Space / Airbus', 'station', 'LEO', 400, 51.6, 28000, 60, 340, '1e-4', 2028, 'in_development', 'Free-flying single-launch station with George Washington U lab'),
('Orbital Reef', 'Blue Origin / Sierra Space', 'station', 'LEO', 400, 51.6, 90000, 175, 830, '1e-4', 2030, 'in_development', 'Mixed-use business park; Sierra LIFE habitats + node modules'),
('Vast Haven-1', 'Vast Space', 'station', 'LEO', 400, 51.6, 11000, 12, 45, '1e-3', 2026, 'in_development', 'First commercial station launch target Aug 2026; Falcon 9'),
('Axiom Module Hab One', 'Axiom Space', 'station', 'LEO', 410, 51.6, 35000, 100, 350, '1e-4', 2027, 'in_development', 'Attaches to ISS, later free-flies; Thales Alenia primary structure'),
('Sierra LIFE Habitat-1', 'Sierra Space', 'station', 'LEO', 400, 51.6, 12000, 30, 300, '1e-4', 2028, 'in_development', 'Inflatable habitat, 27ft diameter expanded'),
('Tiangong Wentian Lab', 'CMSA / CMS', 'station', 'LEO', 380, 41.5, 23000, 40, 110, '1e-4', 2022, 'operational', 'Chinese space station experiment module'),
('Bishop Airlock', 'Nanoracks (Voyager)', 'hosted_payload', 'ISS', 420, 51.64, 1400, 1, 5, '1e-4', 2020, 'operational', 'Commercial airlock; rapid payload deployment'),
('Rocket Lab Photon HASTE', 'Rocket Lab', 'free_flyer', 'LEO', 500, 60, 165, 0.7, 0, '1e-4', 2024, 'operational', 'Hosted small-payload microgravity bus')
ON CONFLICT DO NOTHING;

-- Manufacturing batches: real microgravity products (ZBLAN fiber, ritonavir crystals, semiconductor crystals)
INSERT INTO manufacturing_batches (platform_id, product_name, product_family, batch_code, mass_g, yield_pct, earth_value_per_g, process_start, process_end, returned_to_earth, return_method, defects, status, notes) VALUES
(1, 'Ritonavir HIV Crystals', 'protein_crystal', 'VRD-W1-RIT-01', 0.85, 78.0, 850000, '2023-06-15', '2024-02-20', TRUE, 'Varda capsule', 2, 'returned', 'Hypersonic re-entry to UT desert; first commercial pharma return'),
(2, 'Ritonavir Form-II', 'pharma', 'VRD-W2-RIT-02', 1.4, 84.5, 850000, '2025-08-10', '2025-12-05', TRUE, 'Varda capsule', 1, 'returned', 'Improved polymorph selection'),
(3, 'Antiviral Crystal Suite', 'pharma', 'VRD-W3-AV-01', 1.2, 81.0, 920000, '2026-02-10', NULL, FALSE, 'Varda capsule', 0, 'processing', 'Multi-API batch including remdesivir analogs'),
(5, 'ZBLAN Optical Fiber - Run 14', 'ZBLAN', 'MIS-ZBLAN-014', 4.8, 62.0, 250000, '2024-04-12', '2024-05-08', TRUE, 'Dragon', 1, 'returned', 'Loss < 0.001 dB/km — 100x better than silica'),
(5, 'ZBLAN Optical Fiber - Run 15', 'ZBLAN', 'MIS-ZBLAN-015', 6.2, 71.0, 250000, '2024-09-01', '2024-10-04', TRUE, 'Dragon', 0, 'returned', 'Mid-IR transmission validated for laser surgery'),
(5, 'ZBLAN Optical Fiber - Run 16', 'ZBLAN', 'MIS-ZBLAN-016', 7.4, 76.0, 250000, '2025-03-15', '2025-04-22', TRUE, 'Dragon', 0, 'returned', NULL),
(5, 'ZBLAN Optical Fiber - Run 17', 'ZBLAN', 'MIS-ZBLAN-017', 8.1, 79.5, 250000, '2025-11-02', '2025-12-09', TRUE, 'Dragon', 1, 'returned', 'New crucible design'),
(5, 'ZBLAN Optical Fiber - Run 18', 'ZBLAN', 'MIS-ZBLAN-018', 9.0, 82.0, 280000, '2026-03-01', NULL, FALSE, 'Dragon', 0, 'processing', 'Live batch'),
(4, 'Polymer Tool Set - SPHERES', 'alloy', 'AMF-2026-001', 850, 99.0, 50, '2026-01-10', '2026-01-12', TRUE, 'Dragon', 0, 'returned', 'On-demand printed tools for astronauts'),
(4, 'OGS Sensor Bracket', 'alloy', 'AMF-2026-007', 95, 100.0, 80, '2026-02-22', '2026-02-22', FALSE, NULL, 0, 'installed', 'Used on ISS — never returned'),
(7, 'Ophthalmic Drug Crystals', 'pharma', 'ICF-2025-Q4-03', 0.32, 88.0, 1200000, '2025-10-05', '2025-11-12', TRUE, 'Dragon', 0, 'returned', 'Eli Lilly partnership; cancer drug API'),
(7, 'Monoclonal Antibody Crystals', 'protein_crystal', 'ICF-2026-Q1-01', 0.45, 91.0, 980000, '2026-01-15', '2026-02-20', TRUE, 'Dragon', 0, 'returned', 'Merck oncology pipeline'),
(6, 'Turbine Blade Ceramic Core', 'alloy', 'TCM-2025-08', 120, 94.0, 1200, '2025-08-01', '2025-08-15', TRUE, 'Dragon', 0, 'returned', 'GE Aviation eval; investment-cast core'),
(15, 'Microalloy Casting Run', 'alloy', 'PHO-MA-001', 220, 86.0, 600, '2024-11-15', '2024-11-29', TRUE, 'Photon return', 0, 'returned', 'Niobium-Hf alloy without gravity-driven segregation'),
(1, 'Retina Chip Wafer (InP)', 'retina_chip', 'VRD-W1-INP-01', 2.1, 70.0, 4000000, '2023-08-01', '2024-02-20', TRUE, 'Varda capsule', 3, 'returned', 'LambdaVision style retinal implant substrate'),
(2, 'Retina Chip Wafer Gen2', 'retina_chip', 'VRD-W2-INP-02', 3.4, 79.0, 4000000, '2025-09-12', '2025-12-05', TRUE, 'Varda capsule', 1, 'returned', NULL),
(7, 'Insulin Crystal Run 7', 'pharma', 'ICF-2026-INS-07', 0.95, 92.0, 720000, '2026-04-01', NULL, FALSE, 'Dragon', 0, 'processing', NULL),
(3, 'Hypersonic Re-entry Test Article', 'alloy', 'VRD-W3-DOD-01', 4500, 100.0, 5, '2026-03-20', NULL, FALSE, 'Varda capsule', 0, 'processing', 'DARPA hypersonic glide test'),
(13, 'CMSA Crystal Growth A12', 'semiconductor_crystal', 'TGW-A12', 18, 84.0, 4500, '2025-06-10', '2025-07-04', TRUE, 'Soyuz', 0, 'returned', 'Indium phosphide ingot for photonics'),
(13, 'CMSA Crystal Growth A15', 'semiconductor_crystal', 'TGW-A15', 22, 87.0, 4800, '2026-02-01', '2026-03-08', TRUE, 'Shenzhou', 0, 'returned', 'InGaP for solar cells'),
(4, 'On-demand Ratchet Wrench', 'alloy', 'AMF-2026-014', 110, 100.0, 60, '2026-04-12', '2026-04-12', FALSE, NULL, 0, 'installed', 'First Time Made in Space tool repeat order'),
(11, 'Axiom Glass Optics Sample', 'alloy', 'AX-2027-OPT-01', 280, 80.0, 8500, '2027-09-01', NULL, FALSE, 'Dragon', 0, 'planned', NULL)
ON CONFLICT DO NOTHING;

-- ISRU sites: real candidate locations (Shackleton, Jezero MOXIE successor, lunar Mare basalt, asteroid)
INSERT INTO isru_sites (name, body, region, feedstock, process, capacity_kg_per_day, power_required_kw, operator, commissioning_year, status) VALUES
('Shackleton Crater PSR Plant 1', 'Moon', 'Shackleton Crater, South Pole', 'water_ice', 'thermal_extraction', 220, 35, 'NASA / Astrobotic', 2029, 'operational'),
('Shackleton Crater PSR Plant 2', 'Moon', 'Shackleton Crater, South Pole', 'water_ice', 'thermal_extraction', 380, 55, 'NASA / Astrobotic', 2030, 'commissioning'),
('Malapert Mountain Solar ISRU', 'Moon', 'Malapert Mountain', 'water_ice', 'thermal_extraction', 95, 18, 'NASA / Intuitive Machines', 2030, 'operational'),
('Aristarchus Pyroclastic Mine', 'Moon', 'Aristarchus Plateau', 'regolith', 'electrolysis', 60, 75, 'ESA / iSpace', 2031, 'commissioning'),
('Mare Imbrium ROxygen Pilot', 'Moon', 'Mare Imbrium', 'regolith', 'electrolysis', 45, 60, 'JAXA', 2030, 'operational'),
('Apollo 17 Site Regolith Lab', 'Moon', 'Taurus-Littrow', 'regolith', 'pyrolysis', 25, 28, 'NASA Glenn / Blue Origin', 2031, 'in_development'),
('Jezero Crater MOXIE-2', 'Mars', 'Jezero Crater', 'CO2', 'SOXE', 24, 4, 'NASA / MIT', 2033, 'planned'),
('Mars Atmospheric ISRU Pilot', 'Mars', 'Acidalia Planitia', 'CO2', 'SOXE', 200, 30, 'SpaceX', 2035, 'planned'),
('Psyche Asteroid Survey ISRU', 'Asteroid', '16 Psyche', 'regolith', 'electrolysis', 5, 12, 'AstroForge', 2034, 'planned'),
('Bennu Sample Recovery', 'Asteroid', '101955 Bennu', 'regolith', 'thermal_extraction', 2, 3, 'TransAstra', 2032, 'planned'),
('Lunar South Pole Helium-3 Pilot', 'Moon', 'South Pole basin', 'regolith', 'pyrolysis', 0.05, 100, 'Interlune', 2032, 'in_development'),
('Lunar Equator Regolith Sinter', 'Moon', 'Equatorial belt', 'regolith', 'pyrolysis', 80, 65, 'Blue Origin Blue Alchemist', 2030, 'operational')
ON CONFLICT DO NOTHING;

INSERT INTO isru_production_runs (site_id, output_product, output_kg, start_time, end_time, energy_kwh, purity_pct, yield_pct, notes) VALUES
(1, 'H2O', 1850, '2029-04-01 00:00:00', '2029-04-10 23:59:00', 7800, 88.0, 78.5, 'First polar water extraction run'),
(1, 'H2O', 2240, '2029-06-15 00:00:00', '2029-06-25 23:59:00', 7950, 91.0, 81.2, NULL),
(1, 'H2O', 2410, '2029-09-01 00:00:00', '2029-09-10 23:59:00', 8100, 92.5, 83.0, NULL),
(2, 'H2O', 3650, '2030-03-01 00:00:00', '2030-03-10 23:59:00', 12500, 89.0, 84.5, 'Larger Plant 2 ramping'),
(2, 'O2', 1820, '2030-03-15 00:00:00', '2030-03-25 23:59:00', 9800, 99.5, 92.0, 'O2 from electrolysis of extracted water'),
(2, 'H2', 230, '2030-03-15 00:00:00', '2030-03-25 23:59:00', 9800, 99.7, 91.0, 'Co-product hydrogen for fuel cells'),
(3, 'H2O', 920, '2030-05-15 00:00:00', '2030-05-25 23:59:00', 4200, 85.0, 76.0, NULL),
(4, 'O2', 380, '2031-01-15 00:00:00', '2031-01-25 23:59:00', 18000, 99.0, 71.0, 'Molten Regolith Electrolysis pilot'),
(4, 'Si', 110, '2031-02-01 00:00:00', '2031-02-10 23:59:00', 17500, 92.0, 68.0, 'Co-product silicon for solar cells'),
(4, 'Fe', 85, '2031-02-15 00:00:00', '2031-02-25 23:59:00', 17800, 88.0, 65.0, NULL),
(5, 'O2', 290, '2030-09-01 00:00:00', '2030-09-10 23:59:00', 14200, 99.2, 73.0, 'JAXA ROxygen pilot'),
(5, 'Al', 75, '2030-10-01 00:00:00', '2030-10-15 23:59:00', 13800, 89.0, 64.0, NULL),
(7, 'O2', 22, '2033-04-01 00:00:00', '2033-04-02 23:59:00', 95, 99.6, 88.0, 'Scaled MOXIE-2 demo on Mars'),
(8, 'O2', 1880, '2035-08-01 00:00:00', '2035-08-10 23:59:00', 6800, 99.8, 92.0, 'Starship-class ISRU pilot pre-crew'),
(12, 'Si', 320, '2030-11-01 00:00:00', '2030-11-15 23:59:00', 11500, 95.0, 82.0, 'Blue Alchemist solar wafers from regolith'),
(12, 'O2', 480, '2030-12-01 00:00:00', '2030-12-15 23:59:00', 11200, 99.4, 85.0, 'Co-product')
ON CONFLICT DO NOTHING;

-- Real launch vehicles with actual published costs
INSERT INTO launch_vehicles (name, operator, payload_leo_kg, payload_gto_kg, payload_tli_kg, cost_per_launch_millions, cost_per_kg_leo, reusable, status, first_flight_year, fairing_diameter_m, notes) VALUES
('Falcon 9 Block 5', 'SpaceX', 22800, 8300, 4020, 69.75, 2720, TRUE, 'active', 2018, 5.2, 'Workhorse; ~$2720/kg LEO published rideshare'),
('Falcon Heavy', 'SpaceX', 63800, 26700, 16800, 97.0, 1500, TRUE, 'active', 2018, 5.2, 'Two reusable side cores; expendable center'),
('Starship Block 2', 'SpaceX', 150000, 27000, 100000, 100.0, 670, TRUE, 'active', 2025, 9.0, 'Target $10/kg long-term; currently ~$670/kg'),
('Electron', 'Rocket Lab', 320, 0, 0, 7.5, 23400, FALSE, 'active', 2017, 1.2, 'Small-sat dedicated; high $/kg by design'),
('Neutron', 'Rocket Lab', 13000, 1500, 0, 50.0, 3800, TRUE, 'active', 2025, 5.0, 'Reusable medium-lift; constellation focus'),
('Vulcan Centaur VC6', 'ULA', 27200, 14400, 12100, 110.0, 4040, FALSE, 'active', 2024, 5.4, 'National security workhorse'),
('New Glenn', 'Blue Origin', 45000, 13600, 7000, 68.0, 1510, TRUE, 'active', 2025, 7.0, 'Reusable booster, expendable upper'),
('Ariane 6 (A64)', 'Arianespace / ESA', 21650, 11500, 8600, 115.0, 5310, FALSE, 'active', 2024, 5.4, 'European autonomous access'),
('Long March 5B', 'CASC', 25000, 14000, 8200, 70.0, 2800, FALSE, 'active', 2020, 5.2, NULL),
('Long March 9', 'CASC', 140000, 50000, 50000, 350.0, 2500, FALSE, 'in_development', 2030, 10.6, 'Heavy-lift competitor to Starship'),
('H3-24L', 'JAXA / MHI', 6500, 4000, 0, 45.0, 6920, FALSE, 'active', 2023, 5.2, NULL),
('Soyuz-2.1b', 'Roscosmos', 8200, 3250, 0, 48.0, 5850, FALSE, 'active', 2006, 4.1, NULL),
('SLS Block 1B', 'NASA / Boeing', 105000, 0, 42000, 2200.0, 21000, FALSE, 'active', 2024, 8.4, 'Artemis program; very high $/kg'),
('Terran R', 'Relativity Space', 23500, 5500, 0, 55.0, 2340, TRUE, 'in_development', 2026, 5.0, '3D-printed reusable medium-lift')
ON CONFLICT DO NOTHING;

INSERT INTO launch_manifests (vehicle_id, flight_number, launch_date, payload_name, customer, payload_mass_kg, destination, contract_value_millions, status) VALUES
(1, 'F9-302', '2026-01-20', 'Starlink V2-Mini x21', 'SpaceX', 17600, 'LEO', 0, 'success'),
(1, 'F9-308', '2026-02-15', 'Dragon CRS-32', 'NASA', 17000, 'ISS', 152, 'success'),
(1, 'F9-315', '2026-03-04', 'Vast Haven-1', 'Vast Space', 11000, 'LEO', 67, 'success'),
(2, 'FH-12', '2026-04-10', 'GOES-U', 'NOAA', 5200, 'GTO', 152, 'success'),
(3, 'SS-V25', '2026-02-28', 'Starship 50 Starlink', 'SpaceX', 60000, 'LEO', 0, 'success'),
(3, 'SS-V26', '2026-04-22', 'Lunar Cargo Test', 'NASA HLS', 95000, 'TLI', 230, 'success'),
(3, 'SS-V27', '2026-05-30', 'Starship Refueling Demo', 'SpaceX', 120000, 'LEO', 0, 'scheduled'),
(4, 'ELE-58', '2026-01-12', 'CAPSTONE Follow-on', 'NASA', 25, 'LEO', 8, 'success'),
(4, 'ELE-62', '2026-03-08', 'BlackSky Gen-3 x4', 'BlackSky', 280, 'SSO', 12, 'success'),
(5, 'NEU-3', '2026-04-18', 'Globalstar FM18-22', 'Globalstar', 8500, 'LEO', 50, 'success'),
(6, 'VC-09', '2026-01-30', 'NROL-129', 'NRO', 8800, 'LEO', 110, 'success'),
(6, 'VC-11', '2026-03-22', 'Project Kuiper Batch-4', 'Amazon', 16400, 'LEO', 95, 'success'),
(7, 'NG-2', '2026-02-10', 'Blue Moon MK1 Cargo', 'Blue Origin', 9500, 'TLI', 68, 'success'),
(7, 'NG-3', '2026-04-08', 'Project Kuiper Batch-6', 'Amazon', 28000, 'LEO', 68, 'success'),
(8, 'A64-04', '2026-02-25', 'Galileo FOC FM27-30', 'EU/EUSPA', 3200, 'MEO', 115, 'success'),
(10, 'CZ9-1', '2030-08-15', 'CMSA Lunar Cargo', 'CMSA', 140000, 'TLI', 350, 'scheduled'),
(11, 'H3-08', '2026-03-15', 'HTV-X3 Cargo', 'JAXA/NASA', 6200, 'ISS', 45, 'success'),
(13, 'SLS-3', '2026-09-15', 'Artemis III Crew', 'NASA', 26500, 'TLI', 2200, 'scheduled'),
(14, 'TR-01', '2026-06-15', 'Iridium NEXT-2 x10', 'Iridium', 18000, 'LEO', 55, 'scheduled'),
(1, 'F9-322', '2026-04-05', 'Varda W-3', 'Varda Space', 120, 'LEO', 5, 'success'),
(1, 'F9-330', '2026-05-12', 'Axiom Ax-5 Crew', 'Axiom Space', 12500, 'ISS', 175, 'scheduled'),
(3, 'SS-V28', '2026-07-20', 'HLS Demonstration', 'NASA', 80000, 'TLI', 230, 'scheduled'),
(2, 'FH-13', '2026-08-12', 'Europa Clipper Follow-on', 'NASA', 6200, 'GTO', 178, 'scheduled')
ON CONFLICT DO NOTHING;

-- Microgravity-advantage products with real market data
INSERT INTO microgravity_products (product_name, category, microgravity_advantage, earth_market_size_millions, unit_price_usd, unit, trl, primary_developer, earth_equivalent_quality_pct, microgravity_quality_pct, notes) VALUES
('ZBLAN Fluoride Fiber', 'optical_fiber', 'No convection-driven crystal nucleation; loss < 0.001 dB/km vs ~0.2 dB/km silica', 4800, 250000, 'g', 7, 'Redwire (Made In Space)', 35, 95, 'Mid-IR transmission for medical lasers, defense, sensing'),
('Ritonavir Crystals (Pharma)', 'protein_crystal', 'Larger, more uniform crystals → better X-ray diffraction for drug structure', 1200, 850000, 'g', 8, 'Varda Space Industries', 60, 95, 'AbbVie HIV drug; first commercial in-space return Feb 2024'),
('Retina Chips (LambdaVision)', 'retina_chip', 'Bacteriorhodopsin protein films deposit uniformly in microgravity', 950, 4000000, 'unit', 6, 'LambdaVision', 45, 92, 'Restores sight in retinitis pigmentosa patients'),
('Monoclonal Antibody Crystals', 'protein_crystal', 'Suspension-cell crystallization without sedimentation; better polymorphs', 14500, 980000, 'g', 7, 'Merck / Redwire ICF', 55, 93, 'Oncology pipeline'),
('Indium Phosphide (InP) Crystals', 'semiconductor_crystal', 'No convection → defect-free III-V crystals for photonics', 2100, 4500, 'g', 6, 'Tiangong / CMSA', 70, 96, 'Telecom lasers, 5G/6G RF'),
('InGaP Solar Cell Crystals', 'semiconductor_crystal', 'High-efficiency III-V tandem cells for space PV', 800, 4800, 'g', 5, 'CMSA / Tiangong', 65, 94, '~33% efficient cells when grown defect-free'),
('Stem Cell Expansion', 'biotech', 'Microgravity preserves stem cell pluripotency; 10x yield', 8200, 120000, 'g', 5, 'CASIS / multiple', 50, 88, 'iPSC and MSC therapy manufacturing'),
('Bone-Marrow Organoids', 'biotech', 'Self-assembly without gravity collapse; better drug screens', 3400, 95000, 'g', 4, 'Sphere Entertainment Bio', 40, 85, 'Drug screening platform'),
('Insulin Crystals (Lily)', 'pharma', 'Uniform crystal habit → slower-release injectables', 35000, 720000, 'g', 6, 'Eli Lilly / Redwire ICF', 70, 94, 'Sustained-release insulin (basal)'),
('Pancreatic Tumor Organoid Models', 'biotech', '3D self-organization without sedimentation', 1100, 55000, 'g', 4, 'MD Anderson / Axiom', 38, 82, 'Personalized cancer drug screens'),
('Nickel-Superalloy Castings', 'alloy', 'No gravity-driven dendrite segregation; turbine-blade quality up', 2200, 1200, 'g', 5, 'GE Aviation / Redwire TCM', 60, 90, 'Investment-cast aero turbines'),
('Niobium-Hf Microalloy', 'alloy', 'Uniform grain structure for hypersonic leading edges', 450, 850, 'g', 4, 'DARPA / Rocket Lab Photon', 55, 87, 'Hypersonic vehicle thermal protection'),
('Glass Spheres / Microballoons', 'optical_fiber', 'Perfect sphericity for ICF fusion targets, optics', 280, 4500, 'g', 6, 'LLNL / Redwire', 50, 95, 'Fusion energy target capsules'),
('Quantum Dot CdSe/ZnS', 'semiconductor_crystal', 'Monodisperse colloidal QDs without convective mixing', 1850, 12000, 'g', 5, 'Nanosys / Redwire', 65, 92, 'Display QDs at LCD/OLED scale'),
('Biocomposite Wound Patches', 'biotech', 'Collagen + cell scaffolds self-assemble in 3D', 720, 28000, 'g', 4, 'BioServe Space Tech', 45, 86, NULL),
('GaAs Photonic Wafers', 'semiconductor_crystal', 'Vapor-phase growth without buoyant convection', 1900, 6200, 'g', 5, 'IQE / Redwire', 68, 95, 'Concentrator solar, RF'),
('Lipid Nanoparticles (mRNA)', 'pharma', 'Uniform LNP size distribution → better mRNA delivery', 12500, 180000, 'g', 5, 'Moderna / Redwire', 55, 90, 'Vaccine and oncology drug delivery'),
('Diamond Lattice Targets', 'alloy', 'CVD diamond grown without sedimentation defects', 380, 95000, 'g', 5, 'LLNL / De Beers', 60, 93, 'X-ray windows, fusion targets'),
('Single-Crystal Turbine Blades', 'alloy', 'Bridgman crystal growth without convection', 1600, 2200, 'g', 4, 'Rolls-Royce / Redwire', 62, 91, 'Aero engine hot-section'),
('Cardiomyocyte Sheets', 'biotech', '3D cardiac tissue assembly for transplant patches', 540, 65000, 'g', 4, 'JAXA / Cuore Bio', 35, 80, 'Heart-failure patch'),
('Mid-IR Chalcogenide Glass', 'optical_fiber', 'Convection-free glass pulling for 3-10 micron lasers', 450, 320000, 'g', 6, 'IRflex / Redwire', 50, 94, 'Defense, medical imaging')
ON CONFLICT DO NOTHING;

-- Servicing missions (Northrop MEV, Astroscale ELSA, Maxar OSAM)
INSERT INTO servicing_missions (mission_name, servicer_spacecraft, client_spacecraft, operator, service_type, orbit, rendezvous_date, service_end_date, contract_value_millions, status, client_value_extended_years, notes) VALUES
('MEV-1 / IS-901', 'Mission Extension Vehicle 1', 'Intelsat IS-901', 'Northrop Grumman SpaceLogistics', 'life_extension', 'GEO', '2020-02-25', '2025-04-01', 80, 'completed', 5.0, 'First-ever commercial GEO docking; extended IS-901 5yrs'),
('MEV-2 / IS-10-02', 'Mission Extension Vehicle 2', 'Intelsat IS-10-02', 'Northrop Grumman SpaceLogistics', 'life_extension', 'GEO', '2021-04-12', '2026-04-12', 75, 'completed', 5.0, 'Docked while client remained in active service'),
('MRV-1 / MEP demo', 'Mission Robotic Vehicle 1', 'TBD GEO client', 'Northrop Grumman / DARPA', 'refuel', 'GEO', '2026-08-15', NULL, 220, 'planned', 7.0, 'First commercial robotic refueling demo'),
('ELSA-d', 'Astroscale ELSA-d Servicer', 'ELSA-d Client (test target)', 'Astroscale', 'deorbit', 'LEO', '2021-08-25', '2022-09-30', 65, 'completed', 0, 'Demonstrated capture/release with magnetic plate'),
('ELSA-M', 'ELSA-Multi Servicer', 'OneWeb FM-1 defunct', 'Astroscale UK', 'deorbit', 'LEO', '2026-09-10', NULL, 38, 'in_progress', 0, 'First commercial debris removal of operator-owned sat'),
('ADRAS-J', 'Active Debris Removal Demo J', 'H-IIA upper stage', 'Astroscale Japan / JAXA', 'inspection', 'LEO', '2024-04-16', '2024-07-30', 23, 'completed', 0, 'Rendezvoused with uncooperative target; close-proximity'),
('ADRAS-J2', 'ADRAS Phase 2', 'H-IIA upper stage', 'Astroscale Japan / JAXA', 'deorbit', 'LEO', '2027-06-15', NULL, 78, 'planned', 0, 'Capture + controlled re-entry'),
('OSAM-1', 'OSAM-1 Servicer', 'Landsat 7', 'Maxar / NASA', 'refuel', 'LEO', '2026-12-01', NULL, 2050, 'planned', 5.0, 'Government refueling demo of legacy bird'),
('OSAM-2', 'Archinaut One (Made In Space)', 'On-orbit assembly demo', 'Redwire / NASA', 'assembly', 'LEO', '2027-04-20', NULL, 73, 'planned', 0, 'On-orbit beam manufacturing + assembly'),
('Clearspace-1', 'Clearspace-1 Servicer', 'Vespa adapter', 'ClearSpace / ESA', 'deorbit', 'SSO', '2026-11-15', NULL, 110, 'planned', 0, 'First ESA debris removal contract'),
('iBOSS Repair-1', 'iBOSS Servicer', 'TanDEM-X', 'iBOSS / DLR', 'repair', 'SSO', '2027-09-10', NULL, 60, 'planned', 4.0, 'Modular servicing of German radar sat'),
('SpaceLogistics MEP-1', 'Mission Extension Pod', 'Intelsat IS-37e', 'Northrop Grumman', 'life_extension', 'GEO', '2025-06-15', '2030-06-15', 35, 'in_progress', 5.0, 'Attached propulsion pod, leaves servicer free for next job'),
('CONFERS Demo', 'Northrop MRV-1 (joint)', 'Multiple', 'Northrop / SpaceWERX', 'inspection', 'GEO', '2027-02-01', NULL, 18, 'planned', 0, 'Industry standards demo'),
('Orbit Fab GAS Refuel', 'Orbit Fab Tanker-001', 'Astroscale APS-R', 'Orbit Fab / Astroscale', 'refuel', 'LEO', '2026-10-25', NULL, 21, 'planned', 3.0, 'First commercial fuel-as-a-service docking'),
('Tenzing Hypersonic Service', 'Sierra Space Ghost', 'NRO classified', 'Sierra Space / NRO', 'inspection', 'LEO', '2027-03-15', NULL, 95, 'planned', 0, 'Classified inspection mission')
ON CONFLICT DO NOTHING;

INSERT INTO rendezvous_events (mission_id, event_time, event_type, range_m, relative_velocity_mps, delta_v_mps, notes) VALUES
(1, '2020-02-25 07:15:00', 'approach', 80, 0.1, 0.03, 'Final approach inside ellipse'),
(1, '2020-02-25 07:45:00', 'capture', 0, 0.0, 0.01, 'Probe docking into client apogee motor'),
(1, '2025-04-01 12:00:00', 'undock', 0, 0.05, 0.02, 'Released after 5-year life extension'),
(2, '2021-04-12 09:30:00', 'capture', 0, 0.0, 0.01, 'Successful docking with IS-10-02'),
(2, '2026-04-12 10:00:00', 'undock', 0, 0.05, 0.02, NULL),
(4, '2021-08-25 14:00:00', 'capture', 0, 0.0, 0.02, 'Magnetic plate capture'),
(4, '2022-05-15 10:00:00', 'anomaly', 50, 0.3, 0.0, 'Thruster anomaly during release attempt'),
(6, '2024-04-16 11:30:00', 'approach', 50, 0.15, 0.05, 'First close-up imagery of uncooperative upper stage'),
(6, '2024-05-22 09:00:00', 'maneuver', 30, 0.1, 0.08, 'Fly-around photography pass'),
(6, '2024-07-30 16:00:00', 'undock', 1000, 0.5, 0.4, 'Departure burn'),
(5, '2026-09-10 08:15:00', 'approach', 200, 0.2, 0.06, 'Initial standoff'),
(5, '2026-09-10 09:45:00', 'capture', 0, 0.0, 0.02, 'OneWeb plate-based capture'),
(12, '2025-06-15 14:20:00', 'capture', 0, 0.0, 0.02, 'MEP pod attached'),
(14, '2026-10-25 13:00:00', 'capture', 0, 0.0, 0.01, 'Tanker docked, fuel transfer ready'),
(14, '2026-10-25 15:30:00', 'maneuver', 0, 0.0, 0.0, 'Fuel transfer 12 kg hydrazine'),
(3, '2026-08-15 10:00:00', 'approach', 500, 0.3, 0.1, 'MRV-1 first approach'),
(3, '2026-08-15 11:30:00', 'capture', 0, 0.0, 0.02, NULL),
(7, '2027-06-15 12:00:00', 'approach', 1000, 0.5, 0.2, 'ADRAS-J2 final approach planned'),
(8, '2026-12-01 09:00:00', 'approach', 200, 0.2, 0.08, 'OSAM-1 Landsat-7 approach planned'),
(8, '2026-12-01 11:30:00', 'capture', 0, 0.0, 0.02, 'Robotic arm grapple planned'),
(9, '2027-04-20 14:00:00', 'maneuver', 0, 0.0, 0.0, 'Archinaut beam print start'),
(10, '2026-11-15 10:00:00', 'capture', 0, 0.0, 0.02, 'Vespa capture planned')
ON CONFLICT DO NOTHING;
