INSERT INTO bases(name, location, status, power_kw, crew_count, total_regolith_kg)
SELECT 'Runtime Manufacturing Site Alpha', 'Acceptance Range A', 'operational', 100, 4, 0
WHERE NOT EXISTS (SELECT 1 FROM bases WHERE name = 'Runtime Manufacturing Site Alpha');

INSERT INTO bases(name, location, status, power_kw, crew_count, total_regolith_kg)
SELECT 'Runtime Manufacturing Site Beta', 'Acceptance Range B', 'operational', 80, 2, 0
WHERE NOT EXISTS (SELECT 1 FROM bases WHERE name = 'Runtime Manufacturing Site Beta');
