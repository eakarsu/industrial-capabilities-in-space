# Completeness Review: industrial-capabilities-in-space

**Review date:** 2026-07-18

## Assessment basis

Static inspection of project-owned source and configuration only; no dependency installation, build, database migration, external-service call, or runtime launch was performed. The scan considered 104 project files (88 source files), 3 manifest(s), 0 test-like file(s), and 0 CI workflow(s), excluding dependency/generated directories.

## Classification

**Prototype-demo**

This is a prototype/demo for industrial/supply-chain. Generated gap/demo patterns are present: it contains 88 source files and visible routes/pages in `frontend/`, `backend/`, but those surfaces are not evidence of durable domain execution, verified integrations, or operational completion.

## Why it is not complete

- Generated gap/visualization routes describe missing capabilities or simulate recommendations; they do not implement the underlying domain operation.
- Generic LLM calls are used as product behavior without enough typed tools, grounded evidence, deterministic rules, or output evaluation.
- Mock, demo, sample, fixture, or placeholder behavior remains in executable/product paths.
- No recognizable project-owned automated tests were found for the main workflow.
- No checked-in CI workflow proves builds, tests, migrations, and security checks on every change.

## Needed features

1. Connect authoritative BOM, supplier, inventory, quality, schedule, telemetry, and work-order data sources.
2. Implement traceable state transitions for parts, lots, inspections, exceptions, approvals, and change orders.
3. Add constraint-aware planning with human override, uncertainty reporting, and deterministic safety/business rules.
4. Test disrupted supply, late telemetry, unit mismatches, duplicate events, and rollback/replanning scenarios.
5. Add risk-based unit, integration, and end-to-end tests in CI, including migration and failure-path coverage.

## Risks or launch blockers

- Credential/configuration exposure: environment files are present in the repository tree and must be checked against Git history and rotated if real.
- Automation contains destructive process, filesystem, or database operations; do not run it on a shared machine without review.
- Startup appears coupled to seed/migration behavior, risking data mutation or non-repeatable launches.
- AI-provider availability, cost, privacy, prompt injection, and unvalidated output are launch risks until bounded and evaluated.

## Evidence inspected

- `frontend/src/App.tsx:21`
- `backend/routes/sample_data.js:1`
- `backend/server.js`
- `backend/middleware/auth.js`
- `requirements.txt`
- `start.sh`

## Recommended next action

Stop adding generated pages; prove one industrial/supply-chain workflow against real services and persistent state, with tests and measurable acceptance criteria.

## Implementation progress (2026-07-20)

A bounded industrial workflow is now implemented from authoritative material-lot receipt through controlled additive-manufacturing work order, reservation, production telemetry, independent quality inspection, and approval/rejection or documented risk override. Lot intake records source-system/source-record provenance, an allowlisted HTTPS certificate, a payload hash, and an idempotent external event; conflicting replays fail. Quality can quarantine, reject, or attest to release of versioned lots, and reservation locks the work order and lots before atomically enforcing base, material type, purity, status, available quantity, and exact required mass. Work orders have optimistic versions and explicit transitions; typed telemetry enforces canonical metric units, physical bounds, timestamps, required observations, duplicate handling, and a visible late-event flag. Inspection deterministically evaluates quantity, purity, temperature, vibration, produced/measured mass, quality score, defects, and dimensional variance. Failed rules cannot receive ordinary approval; a separate approver must reject or use the exact risk-acceptance attestation with a substantive reason. Reviewed change orders provide a replanning path without rewriting prior evidence.

Authorization now reloads each active user, role, token version, and permitted base from PostgreSQL on every request. JWT algorithm, issuer, audience, and 12-hour expiry are fixed; CORS and authoritative evidence hosts require explicit allowlists; no fallback secret is accepted; shared demo login and hardcoded demo credentials were removed; and operator, quality, approver, and admin duties are separated even for admins. Only `/api/auth`, `/api/health`, and `/api/workflow` are mounted. Generated AI/gap, sample-data, unconstrained CRUD, and other prototype APIs return HTTP 410, so generic LLM output is not part of the supported decision path. The local ignored `.env` is not tracked and no `.env` history was found; it was left untouched, and operators are instructed to rotate any credential that may have been exposed elsewhere.

Persistence now includes base grants, governed material lots, work orders and allocations, telemetry, inspections, change orders, append-only work-order snapshots, ten-year retention/legal-hold fields, and a per-base serialized SHA-256 event chain. Seven PostgreSQL triggers reject event/version/telemetry mutation, lot deletion or non-versioned updates, decided-inspection mutation, retained-work-order deletion, retention shortening, non-monotonic work-order updates, and ordinary legal-hold release. The checksum-verified migration runs separately from startup; a second run is a no-op. Startup is now a small non-mutating process, the Node 22 multi-stage image runs unprivileged against external PostgreSQL, explicit account/audit/schema tools and operations/security guidance are checked in, and CI provisions PostgreSQL 16, repeats the migration, verifies controls, runs backend tests, builds the console, rejects every dependency advisory, scans full Git history for secrets, and builds the image. CI creates its JWT test secret for each run instead of storing reusable key material.

Validation used a fresh PostgreSQL database: the baseline plus governed migration produced 28 public tables and all seven expected governance triggers, and the repeat migration reported `already applied`. Five deterministic unit tests and two real HTTP/PostgreSQL workflow tests passed. The integration tests cover cross-base denial, source replay conflict, insufficient-inventory rollback, quarantine/release, unit mismatch, duplicate and late telemetry, clean approval, rule-blocked approval, risk override, change-order replanning, hash-chain integrity, append-only evidence, and retained deletion failure. The Vite 8 production build passed; backend and frontend audits report zero vulnerabilities; the 25-event validation chain verified; and production smoke checks returned 200 for health/static content, 410 for a legacy AI route, 401 for unauthenticated workflow access, and 403 for a disallowed origin. Independent verification replayed the migration and all seven tests on PostgreSQL 17, repeated those HTTP checks, confirmed the missing-config startup guard, and passed source/full-history Gitleaks scans after replacing a static integration-test key with random per-run material. A local container build could not run because neither Docker nor Podman had a running engine; the same build remains a required CI step.

Production launch still requires organization-selected authoritative supplier/BOM, printer, schedule, and evidence services; verification of certificate contents rather than host provenance alone; representative multi-lot, clock-skew, network retry, quarantine, export, evidence-host outage, backup/restore, legal-hold, and concurrency/load exercises; calibrated process limits and override authority; and mission, quality, safety, security, and records-owner acceptance. The checked-in implementation deliberately does not claim those external contracts or organizational decisions are complete.

## Runtime verification (2026-07-20)

- Verified `start.sh` with disposable PostgreSQL `55661`, the governed API on `127.0.0.1:6130`, and reserved UI port `6131`; all three ports were released afterward.
- The first and only runtime attempt applied the disposable base schema and additive governance controls, provisioned an environment-supplied administrator, logged in through `/api/auth/login`, and verified `/api/auth/me`: `API_VERIFIED startup_login_session_api`.
- Non-production runtime defaults are limited to local CORS and example certificate-host allowlists; production still requires explicit allowlists and a non-placeholder JWT secret. Startup remains non-migrating and non-seeding.
- The migration applied and then reported `already applied`; all 5 deterministic rule tests and both PostgreSQL/HTTP integration workflows passed. The integration listener was pinned to `6130`, and the Vite production build passed.
