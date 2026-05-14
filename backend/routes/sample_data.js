// Sample Data seeder — inserts 5-10 domain-realistic rows per entity.
// Mounted at /api/admin via server.js. JWT-protected.
const router = require('express').Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

const ENTITIES = ['missions', 'bases', 'mining', 'resources', 'print_jobs', 'equipment'];

function pickBaseId(rows) {
  if (!rows || !rows.length) return null;
  return rows[Math.floor(Math.random() * rows.length)].id;
}

const seeders = {
  missions: async () => {
    const rows = [
      ['Shackleton-Crater Survey-7', 'Polar ice prospecting and ISRU validation in permanently shadowed regions', 4, '2027-03-12', '2027-03-18', '2027-09-14', 'planning', 'NASA', 4.8, 'pre-launch readiness'],
      ['Artemis-Aitken Forward-3', 'Establish Aitken-South-Pole-1 forward operating habitat module', 6, '2027-07-22', '2027-07-29', '2028-01-30', 'planning', 'NASA-ESA', 7.2, 'crew training'],
      ['Mare-Tranquillitatis Excavator-2', 'Regolith bulk-haul demonstration with autonomous excavator fleet', 0, '2026-11-05', '2026-11-09', null, 'launched', 'JAXA', 1.4, 'transit cruise'],
      ['Helium-3 Pioneer Run', 'He-3 enrichment pilot from upper-meter regolith near Tranquillitatis', 3, '2028-02-14', '2028-02-20', '2028-08-22', 'planning', 'CNSA', 3.9, 'CDR'],
      ['Peary-Rim Comm-Relay-1', 'Deploy lunar polar relay constellation anchor station', 0, '2026-09-30', '2026-10-04', null, 'transit', 'ESA', 0.9, 'TLI complete'],
      ['Lunar-Gateway Resupply L-12', 'Pressurized cargo and propellant top-up for Gateway', 0, '2026-08-15', null, null, 'completed', 'NASA-SpaceX', 0.6, 'closeout'],
      ['Marius-Hills Lava-Tube Recon', 'Skylight imaging and sub-surface LIDAR mapping', 2, '2027-05-04', '2027-05-09', '2027-07-11', 'planning', 'NASA', 1.1, 'spacecraft I&T'],
      ['Schrodinger-Basin Sample Return', 'South-pole basin volatile sample acquisition', 4, '2028-09-18', '2028-09-25', '2029-03-10', 'planning', 'NASA-ESA', 5.5, 'mission design'],
    ];
    let n = 0;
    for (const r of rows) {
      await db.query(
        `INSERT INTO missions (name,objective,crew_size,launch_date,landing_date,return_date,status,agency,budget_billions,current_phase)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, r);
      n++;
    }
    return n;
  },

  bases: async () => {
    const m = await db.query('SELECT id FROM missions ORDER BY id DESC LIMIT 20');
    const rows = [
      ['Aitken-South-Pole-1', 'South Pole–Aitken Basin', '2025-12-01', 180, 8, 'operational', '85.5°S 31.2°E', -8200, 4500],
      ['Shackleton-Rim Outpost', 'Shackleton Crater Rim', '2026-04-18', 120, 4, 'operational', '89.7°S 0.0°E', 1800, 1200],
      ['Tranquillitatis Forward Camp', 'Mare Tranquillitatis', '2026-08-22', 95, 3, 'commissioning', '8.5°N 31.4°E', -1200, 800],
      ['Marius-Hills Skylight Hab', 'Marius Hills', '2027-01-10', 60, 2, 'planned', '14.2°N 56.6°W', 1300, 0],
      ['Peary-Rim Relay Station', 'Peary Crater', '2026-10-15', 45, 0, 'operational', '88.6°N 33.0°E', 2100, 0],
      ['Schrodinger Geo-Hub', 'Schrodinger Basin', '2027-09-02', 75, 2, 'planned', '75.0°S 132.4°E', -200, 0],
      ['Mare-Imbrium Logistics-2', 'Mare Imbrium', '2026-06-30', 110, 5, 'operational', '32.8°N 15.6°W', -3000, 2200],
    ];
    let n = 0;
    for (const r of rows) {
      await db.query(
        `INSERT INTO bases (name,location,established_date,power_kw,crew_count,status,coordinates,altitude_m,total_regolith_kg,mission_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [...r, pickBaseId(m.rows)]);
      n++;
    }
    return n;
  },

  mining: async () => {
    const b = await db.query('SELECT id FROM bases ORDER BY id DESC LIMIT 20');
    if (!b.rows.length) throw new Error('No bases exist; seed bases first.');
    const rows = [
      ['Shackleton PSR-North Pit-A', 'auger-drill', 42.5, 180, '2026-05-10 06:00', null, 'active', 8200, 1450, 'Targeting water-ice-bearing regolith in PSR; 3% ice fraction observed.'],
      ['Tranquillitatis Strip-2', 'bucket-wheel', 110.0, 60, '2026-06-01 04:30', null, 'active', 22000, 3100, 'Bulk regolith for sintered habitat blocks.'],
      ['Aitken He-3 Test Plot', 'thermal-desorption', 18.0, 200, '2026-07-15 02:00', '2026-07-22 12:00', 'paused', 1900, 980, 'He-3 yield 6 ppb; gas chromatograph drift triggered pause.'],
      ['Peary-Rim Sample Trench', 'manual-EVA', 4.2, 90, '2026-08-04 09:00', '2026-08-04 14:00', 'completed', 22, 12, 'Crew EVA grab-sample for lab cross-check.'],
      ['Imbrium Highwall-1', 'rotary-bucket', 88.0, 220, '2026-09-12 03:00', null, 'active', 13400, 1800, 'Ilmenite-rich basalt; feeding oxygen-extraction line.'],
      ['Schrodinger Volatile Probe', 'rotary-percussive', 9.5, 350, '2026-10-02 01:00', null, 'active', 760, 410, 'Cryogenic core capture for volatiles inventory.'],
      ['Marius Lava-Tube Floor', 'auger-drill', 26.0, 140, '2026-11-08 22:00', null, 'planned', 0, 0, 'Awaiting lava-tube sub-surface entry permit.'],
    ];
    let n = 0;
    for (const r of rows) {
      await db.query(
        `INSERT INTO mining_operations (base_id,site_name,method,regolith_kg_per_hour,depth_cm,started_at,ended_at,status,total_extracted_kg,energy_kw_consumed,notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [pickBaseId(b.rows), ...r]);
      n++;
    }
    return n;
  },

  resources: async () => {
    const b = await db.query('SELECT id FROM bases ORDER BY id DESC LIMIT 20');
    if (!b.rows.length) throw new Error('No bases exist; seed bases first.');
    const rows = [
      ['water_ice', 1240.5, 92.4, '2026-05-12', 'Cryo-Vault A', 35.0, 'stored'],
      ['helium_3', 0.084, 99.1, '2026-07-22', 'Iso-Cell H3-1', 1500000.0, 'stored'],
      ['regolith_bulk', 22000.0, 100.0, '2026-06-04', 'Hopper-2', 0.6, 'stored'],
      ['oxygen_lox', 480.0, 99.6, '2026-08-01', 'LOX-Tank-3', 12.0, 'in_use'],
      ['ilmenite_concentrate', 1830.0, 86.5, '2026-09-14', 'Bin-IL-2', 7.5, 'stored'],
      ['hydrogen_lh2', 95.0, 99.9, '2026-08-18', 'LH2-Tank-1', 28.0, 'reserved'],
      ['rare_earth_mix', 12.4, 71.2, '2026-10-03', 'Lab Vault-B', 4200.0, 'stored'],
      ['silicon_metallurgical', 320.0, 95.0, '2026-09-25', 'Bin-Si-1', 18.0, 'in_use'],
    ];
    let n = 0;
    for (const r of rows) {
      await db.query(
        `INSERT INTO resources (base_id,resource_type,quantity_kg,purity_pct,extraction_date,storage_location,market_value_per_kg,status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [pickBaseId(b.rows), ...r]);
      n++;
    }
    return n;
  },

  print_jobs: async () => {
    const b = await db.query('SELECT id FROM bases ORDER BY id DESC LIMIT 20');
    if (!b.rows.length) throw new Error('No bases exist; seed bases first.');
    const rows = [
      ['Habitat Module H-04 Shell', 'habitat_shell', 4200.0, '6.0m x 6.0m x 3.2m', 4180.0, 'completed', '2026-04-02 08:00', '2026-04-09 17:30', true, 94, 'Sintered regolith; passed pressure proof at 110 kPa.'],
      ['EVA Airlock Frame A2', 'airlock_frame', 850.0, '2.4m x 2.4m x 2.0m', 845.0, 'completed', '2026-05-11 09:00', '2026-05-13 22:10', true, 91, 'Reinforced with basalt-fiber lattice.'],
      ['Solar-Array Mast Section', 'structural', 220.0, '8.0m x 0.4m x 0.4m', 218.5, 'completed', '2026-06-20 04:00', '2026-06-21 18:30', true, 88, null],
      ['Radiation Shield Panel R-12', 'shield_panel', 1100.0, '4.0m x 2.0m x 0.5m', 1095.0, 'completed', '2026-07-04 02:00', '2026-07-06 11:00', true, 96, 'Layered ilmenite-rich composite.'],
      ['Greenhouse Dome G-2', 'habitat_shell', 3100.0, '5.0m radius hemisphere', 3080.0, 'in_progress', '2026-08-22 06:30', null, null, null, 'Layer 412/600.'],
      ['Rover Wheel Hub Set-7', 'mechanical', 38.0, '0.6m x 0.6m x 0.2m', 37.5, 'failed', '2026-09-01 10:00', '2026-09-01 14:20', false, 42, 'Layer adhesion failure at z=180mm; recycle.'],
      ['Comm Antenna Truss', 'structural', 95.0, '3.0m x 0.3m x 0.3m', 94.0, 'queued', null, null, null, null, 'Awaiting feedstock top-up.'],
      ['Cryo-Storage Liner C-3', 'tankage', 540.0, '3.0m x 1.2m x 1.2m', 535.0, 'in_progress', '2026-10-04 22:00', null, null, null, null],
    ];
    let n = 0;
    for (const r of rows) {
      await db.query(
        `INSERT INTO print_jobs (base_id,structure_name,structure_type,material_used_kg,dimensions,mass_kg,status,started_at,completed_at,success,quality_score,notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [pickBaseId(b.rows), ...r]);
      n++;
    }
    return n;
  },

  equipment: async () => {
    const b = await db.query('SELECT id FROM bases ORDER BY id DESC LIMIT 20');
    if (!b.rows.length) throw new Error('No bases exist; seed bases first.');
    const rows = [
      ['LIDAR-Mast Pol-1', 'sensor_lidar', 'operational', '2026-04-15 12:00', 97, 1840, 0, '2027-04-15 12:00'],
      ['Auger-Drill Rig AD-3', 'drilling_rig', 'operational', '2026-05-02 09:00', 88, 2200, 2, '2026-11-02 09:00'],
      ['Bucket-Wheel Excavator BW-1', 'excavator', 'maintenance', '2026-08-30 14:00', 73, 4100, 5, '2026-12-30 14:00'],
      ['Sintering Print-Head SP-7', 'additive_manufacturing', 'operational', '2026-07-12 08:00', 92, 1320, 1, '2027-01-12 08:00'],
      ['Cryo-Pump CP-2', 'fluid_handling', 'operational', '2026-06-22 11:00', 95, 980, 0, '2027-06-22 11:00'],
      ['Pressurized Rover PR-04', 'rover', 'operational', '2026-09-05 16:30', 84, 3650, 3, '2027-03-05 16:30'],
      ['Regolith Hopper RH-2', 'storage_handling', 'operational', '2026-08-19 07:00', 90, 2700, 1, '2027-02-19 07:00'],
      ['Electrolysis Stack ES-1', 'isru_processor', 'fault', '2026-09-28 02:00', 41, 1180, 8, '2026-10-28 02:00'],
      ['Comm Relay Dish CR-A', 'communications', 'operational', '2026-05-30 10:00', 99, 4200, 0, '2027-05-30 10:00'],
    ];
    let n = 0;
    for (const r of rows) {
      await db.query(
        `INSERT INTO equipment (base_id,name,equipment_type,status,last_maintenance,efficiency_pct,operating_hours,fault_count,next_service_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [pickBaseId(b.rows), ...r]);
      n++;
    }
    return n;
  },
};

router.get('/sample-data/entities', verifyToken, (_req, res) => {
  res.json({ entities: ENTITIES });
});

router.post('/sample-data/:entity', verifyToken, async (req, res) => {
  const entity = req.params.entity;
  const fn = seeders[entity];
  if (!fn) return res.status(400).json({ error: `Unknown entity '${entity}'`, allowed: ENTITIES });
  try {
    const inserted = await fn();
    res.json({ inserted, entity });
  } catch (e) {
    res.status(500).json({ error: e.message, entity });
  }
});

module.exports = router;
