# LunarBase Audit Note

Project: industrial-capabilities-in-space (LunarBase)
Last update: 2026-05-07

## Conventions
- Backend: Express on port 3010, PostgreSQL DB `lunar_ops_db`.
- Auth: JWT bearer token (`Authorization: Bearer <token>`), `verifyToken` middleware.
- `users.password` column (bcrypt-hashed) — do NOT rename to `password_hash`.
- Login: `admin@demo.com` / `demo123`.
- AI uses OpenRouter (`OPENROUTER_API_KEY`); when missing/upstream-failing, AI extras endpoints return HTTP 503 with `{ error }`.
- Frontend uses `apiFetch` wrapper that injects bearer token automatically.

## Apply3 — Feature Add (2026-05-07)
Added 5 new AI features + 3 utility features. No existing files were modified destructively; all additions are additive.

### New backend
- `backend/routes/ai_extras.js` — POST endpoints (all under `/api/ai`):
  - `/mining-yield`         — Mining yield predictor
  - `/regolith-classifier`  — Regolith composition classifier
  - `/eva-risk`             — EVA risk scorer
  - `/telemetry-anomaly`    — Telemetry anomaly detector
  - `/supply-prioritizer`   — Earth-to-Moon supply run prioritizer
- `backend/routes/utilities.js` — under `/api/util`:
  - `GET  /export/:entity`  — CSV export (entities: bases, missions, mining, resources, print_jobs, equipment)
  - `GET  /search`          — cross-entity search (`q`, `entity`, `status` query params)
  - `GET  /audit`, `POST /audit` — audit log (filter `action`, `entity_type`, `limit`)
- `server.js` mounts both new routers (`/api/ai` ai_extras, `/api/util` utilities).

### Schema additions
- `audit_log` table in `backend/db/schema.sql` (additive, IF NOT EXISTS).

### New frontend
- `frontend/src/pages/AILabPage.tsx`     — UI for all 5 new AI features.
- `frontend/src/pages/UtilitiesPage.tsx` — UI for CSV export, search/filter, audit log viewer.
- `frontend/src/api.ts` extended with `aiMiningYield`, `aiRegolithClassifier`, `aiEvaRisk`, `aiTelemetryAnomaly`, `aiSupplyPrioritizer`, `exportCsvUrl`, `search`, `getAuditLog`, `postAudit`.
- `App.tsx` routes: `/ai_lab`, `/utilities`.
- `Layout.tsx` sidebar links: "AI Lab" (under AI Center group) and "Utilities" (Tools group).

### Behavior
- All AI extras return 503 if `OPENROUTER_API_KEY` missing or upstream non-2xx.
- Every AI call + each search + each CSV export is recorded into `audit_log` (best-effort; never blocks the response).
- Search uses `ILIKE` against per-entity searchable columns; status filter applied where the column exists.

### Smoke test (2026-05-07)
Backend booted on :3010, logged in as `admin@demo.com / demo123`, verified:
- `GET /api/util/search?q=Shackleton` returned results across entities.
- `GET /api/util/export/bases` returned CSV.
- `POST /api/ai/mining-yield` returned 503 (OPENROUTER_API_KEY not set in this env) — correct behavior.
- `GET /api/util/audit` reflected the search + export events.
- Backend `node -c` passed for all routes; frontend `tsc --noEmit` clean.

## Apply3 — Sample Data Page (2026-05-07)
Additive feature — one button per main entity to seed 5–10 domain-realistic rows.

### New backend
- `backend/routes/sample_data.js` mounted at `/api/admin`.
  - `POST /api/admin/sample-data/:entity` — JWT-protected; entities: `missions`, `bases`, `mining`, `resources`, `print_jobs`, `equipment`. Returns `{inserted, entity}`.
  - `GET  /api/admin/sample-data/entities` — list of allowed entities.
- Domain seeds: lunar mission profiles (Shackleton/Artemis/Schrodinger), real bases (Aitken-South-Pole-1, Peary-Rim, Tranquillitatis), He-3 / water-ice / regolith mining, sintered-regolith print jobs, LIDAR/drill-rig/excavator equipment.
- Mining/Resources/Print Jobs/Equipment seeders auto-pick an existing `base_id` to keep FK integrity; error returned if no bases yet.
- `users` and `audit_log` tables are intentionally skipped.

### New frontend
- `frontend/src/pages/SampleDataPage.tsx` — one card+button per entity, JWT bearer via `apiFetch`, toast + per-entity session counter.
- `frontend/src/api.ts` extended with `seedSampleData(entity)`.
- `App.tsx` route: `/sample_data`.
- `Layout.tsx` sidebar link: "Sample Data" (under Tools group, `Database` icon).

### Smoke test (2026-05-07)
- `POST /api/admin/sample-data/missions` (bearer) → **HTTP 200**, `{"inserted":8,"entity":"missions"}`.
- `POST /api/admin/sample-data/equipment` (no auth) → **HTTP 401** (gate works).
- `POST /api/admin/sample-data/garbage` (bearer) → **HTTP 400** with allowed list.
- Cleanup: 8 seeded missions deleted; port 3010 freed. `node -c` and `tsc --noEmit` pass.

## Apply3 — AI Sample-Prefill Buttons (2026-05-07)
Additive UI: 2-3 prefill buttons per AI feature tab that has free-text form fields. Data-driven tabs (mining-yield, equipment-prediction, resource-valuation, telemetry-anomaly, supply-prioritizer) intentionally not touched — they read from live entity selectors / fleet snapshots, not text inputs.

### Pages modified
- `frontend/src/pages/AICenterPage.tsx`
  - Extraction tab: `Shackleton Ice`, `Mare He-3`, `Ilmenite Ti` (sets first base + target_resource).
  - Mission tab: `Shackleton Ice ISRU` (90d/4), `He-3 Prospect` (45d/3), `Aitken Habitat` (180d/6).
- `frontend/src/pages/AILabPage.tsx`
  - Regolith tab: `Shackleton PSR`, `Tranquillitatis`, `Hadley Highland` (full location/depth/notes with real lunar geochemistry — ilmenite, anorthositic, FFC reduction, hydrogen anomaly +12%/LCROSS).
  - EVA tab: `Shackleton Ice`, `Aitken Repair`, `Peary Ilmenite` (full name/duration/crew/env with real equipment — LIDAR mast, bucket-wheel excavator, ISRU electrolysis).

### Conventions
- `type="button"` on every prefill (no accidental form submit).
- Prefills inserted as a `flex flex-wrap gap-2` row immediately under each tab's heading, above existing form fields. Existing inputs/state/handlers untouched — prefills only call the existing setters.
- Real lunar-mission data: Shackleton Crater PSR, Mare Tranquillitatis, Mons Hadley, Aitken South Pole Basin, Peary Crater rim; water-ice / He-3 / ilmenite / anorthositic regolith / titanium; LIDAR mast, bucket-wheel excavator, sintered-regolith printer, ISRU electrolysis.

### Smoke test (2026-05-07)
- `npx tsc --noEmit` clean.
- `npx vite build` → 1487 modules, 285.74 kB JS / 21.87 kB CSS — bundle compiles.
- Backend booted on :3010, `POST /api/auth/login` admin@demo.com/demo123 → HTTP 200 with JWT (password column preserved).
- Cleanup: backend killed, `frontend/dist/` removed.

## Apply3 — Merge AI Sidebar Entries (2026-05-07)
Consolidated duplicate AI sidebar entries into a single "AI Center" page exposing all 9 AI tools as tabs.

### Pages
- `frontend/src/pages/AICenterPage.tsx` — rewritten. Tabs (9): extraction, equipment, valuation, mission (original) + mining_yield, regolith, eva, telemetry, supply (migrated from AILabPage). Tab grid `grid-cols-3 md:grid-cols-5 lg:grid-cols-9`. All sample-prefill buttons preserved verbatim. 503 fallback message preserved from AILab.
- `frontend/src/pages/AILabPage.tsx` — deleted.

### Routing / Layout
- `frontend/src/App.tsx` — `<Route path="ai_lab" />` now `<Navigate to="/ai" replace />`; AILabPage import removed.
- `frontend/src/components/Layout.tsx` — `/ai_lab` NavLink removed; remaining `/ai` link relabeled "AI Center"; `FlaskConical` import dropped.

### Smoke test (2026-05-07)
- `npx tsc --noEmit` clean.
- `npx vite build` → 1487 modules, 291.25 kB JS / 23.26 kB CSS — bundle compiles.
- Backend on `:3010`, `POST /api/auth/login` admin@demo.com/demo123 → HTTP 200 with JWT (`password` column preserved).
- Cleanup: backend killed, port 3010 freed, `frontend/dist/` removed.

## Apply3 — Dashboard Page (2026-05-07)
Domain-appropriate landing page added as the FIRST sidebar item and post-login default route. Additive only.

### New backend
- `backend/routes/dashboard.js` mounted at `/api/dashboard`.
  - `GET /api/dashboard/stats` — JWT-protected (`verifyToken`). Returns `{ kpis, recent_activity, generated_at }`.
  - KPIs: missions (total/active), bases (total/active), mining (total/active over `mining_operations`), resources (total), print_jobs (total/running), equipment (total/operational). Active-status sets are domain-realistic (e.g. missions: active|in_progress|launched|en_route|on_surface).
  - `recent_activity`: last 10 rows of `audit_log`.
  - Per-query try/catch falls back to 0 / [] so the endpoint stays 200 even if a single table is missing.
- `server.js` — single line appended to mount the new router.

### New frontend
- `frontend/src/pages/Dashboard.tsx` — 6 KPI cards, Recent Activity panel (links to `/utilities` for full log), Quick Actions panel (AI Center, Missions, Lunar Bases, Sample Data), Refresh button, loading/error states.
- `frontend/src/api.ts` extended with `getDashboardStats`.
- `frontend/src/components/Layout.tsx` — `LayoutDashboard` icon imported, `{ to: '/dashboard', label: 'Dashboard' }` prepended as the FIRST `navItems` entry.
- `frontend/src/App.tsx` — index `Navigate` retargeted from `/bases` → `/dashboard`; new `dashboard` route.

### Smoke test (2026-05-07)
- `node -c` on new route + `server.js` pass; `npx tsc --noEmit` clean.
- Backend on :3010, login `admin@demo.com / demo123` → JWT 200.
- `GET /api/dashboard/stats` with bearer → **HTTP 200** (missions 30/2, bases 10/4, mining 30/20, resources 30, print_jobs 30/4, equipment 30/24; 2 audit rows).
- `GET /api/dashboard/stats` without bearer → **HTTP 401**.
- Cleanup: backend killed, port 3010 free. `password` column convention preserved (auth route untouched).

## Apply pass 7 (full backlog implementation) (2026-05-21)

Closed the remaining gap between the backend audit-feature routes (10 gap-* and 5
cf-* routers, all already mounted in `server.js` before the `/api` 404 handler)
and the frontend: the 15 page components existed under `frontend/src/pages/` but
were never imported, routed, or linked, so the only way to exercise them was a
hand-rolled `fetch`. Also surfaced the two existing Codex pages and the Insights
Timeline view which were routed but had no sidebar entry. Additive only — no
existing route or component was renamed or rewritten.

### Items addressed
- 10 gap-* feature pages routed under `/gap/<slug>` and linked in a new "Audit
  Gaps" sidebar group (amber accent): regolith-process-optimizer,
  lunar-night-power, orbital-mechanics-routing, print-quality-predictor,
  crew-task-sequencer, simulation-twin, comms-latency-queue,
  mission-video-stream, isru-yield, print-cad-upload.
- 5 cf-* feature pages routed under `/cf/<slug>` and linked in a new "Capability
  Features" sidebar group (pink accent): regolith-electrolysis,
  lunar-hibernation, lunar-marketplace, teleop-eva-agent, isru-cert-pipeline.
- 3 Codex / Insights entries (`/insights/timeline`, `/codex/custom-viz`,
  `/codex/operations`) exposed in a new "Codex & Insights" sidebar group
  (indigo accent). The routes already existed in `App.tsx`.
- `gap_features` table (used by every cf-* / gap-* route, previously only
  created lazily inside `ensureTable()` at first POST) added to `db/schema.sql`
  with a `(feature_slug, created_at DESC)` index, so a fresh `psql -f schema.sql`
  matches what the running app actually uses.

### Endpoints / pages / tables
- Frontend pages (no new files; existing components newly wired):
  - `/gap/regolith-process-optimizer` → `GapRegolithProcessOptimizer.tsx`
  - `/gap/lunar-night-power` → `GapLunarNightPower.tsx`
  - `/gap/orbital-mechanics-routing` → `GapOrbitalMechanicsRouting.tsx`
  - `/gap/print-quality-predictor` → `GapPrintQualityPredictor.tsx`
  - `/gap/crew-task-sequencer` → `GapCrewTaskSequencer.tsx`
  - `/gap/simulation-twin` → `GapSimulationTwin.tsx`
  - `/gap/comms-latency-queue` → `GapCommsLatencyQueue.tsx`
  - `/gap/mission-video-stream` → `GapMissionVideoStream.tsx`
  - `/gap/isru-yield` → `GapIsruYield.tsx`
  - `/gap/print-cad-upload` → `GapPrintCadUpload.tsx`
  - `/cf/regolith-electrolysis` → `CfRegolithElectrolysis.tsx`
  - `/cf/lunar-hibernation` → `CfLunarHibernation.tsx`
  - `/cf/lunar-marketplace` → `CfLunarMarketplace.tsx`
  - `/cf/teleop-eva-agent` → `CfTeleopEvaAgent.tsx`
  - `/cf/isru-cert-pipeline` → `CfIsruCertPipeline.tsx`
- Endpoints (already mounted, now reachable from the UI): the corresponding
  `POST /api/gap-*` and `POST /api/cf-*` routes plus their `GET .../history`
  siblings. No new endpoints were added in this pass.
- Schema: `gap_features` table + `gap_features_slug_idx` index, both
  `CREATE … IF NOT EXISTS` — safe re-run.

### Skipped (per constraints)
- `backend/routes/ai_extras.js` endpoints remain pure 503 stubs when
  `OPENROUTER_API_KEY` is missing — already wired and intentionally left as-is.
- Did not modify any existing page component, existing API helper, or existing
  route file body — only `App.tsx`, `Layout.tsx`, and `schema.sql` were edited.

### Syntax / build
- `node --check backend/server.js` → OK (file unchanged; verified).
- `cd frontend && npx tsc --noEmit` → 3 pre-existing errors only
  (`CodexCustomVizFeature.tsx`, `LaunchEconomicsPage.tsx`,
  `TimelineView.tsx`); zero new errors in `App.tsx` or `Layout.tsx`.
- All 16 `lucide-react` icon names introduced in `Layout.tsx`
  (Zap, Brain, Activity, Video, Cpu, FileCode2, Plug, Bed, ShoppingBag, Bot,
  Award, Telescope, Gauge, Workflow, Radio, Compass) resolved against the
  installed version of the package via `require('lucide-react')`.

### Status
DONE — all reachable backlog items implemented; no new dependencies added,
no existing route or page rewritten, no breaking changes. Pure stubs and
NEEDS-CREDS items left untouched per constraints.
