# LunarBase governed manufacturing

This repository now supports one bounded operational journey: authoritative material-lot intake → controlled print work order → material reservation → typed telemetry → independent inspection → approval, rejection, or documented risk override. Every work-order state change creates an immutable version and a per-base tamper-evident event. Change orders provide a reviewed replanning path without rewriting prior evidence.

The former generated AI, gap, sample-data, generic CRUD, and unconstrained industrial routes are intentionally not mounted. API calls outside `/api/auth`, `/api/health`, and `/api/workflow` return `410 UNSUPPORTED_SURFACE`. Their source remains historical prototype material, not a production claim.

## Runtime requirements

- Node.js 22
- PostgreSQL 16
- Explicit environment values from `.env.example`
- HTTPS certificate/evidence sources whose hosts appear in `CERTIFICATE_ALLOWED_HOSTS`

`JWT_SECRET` must be a non-placeholder value of at least 32 characters. Wildcard CORS and certificate hosts are rejected; production browser origins must use HTTPS.

## Database and account provisioning

Run schema changes as a separate deployment step. Application startup never creates databases, migrates, seeds, installs packages, kills processes, or exposes a shared demo credential.

```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/db/schema.sql
# Optional only for a new evaluation database: reference lunar operations data.
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/db/seed.sql
npm --prefix backend ci
npm --prefix backend run migrate
```

Provision identities through the explicit command. `OPERATOR`, `QUALITY`, and `APPROVER` users require one or more base IDs; `ADMIN` receives all bases but separation-of-duties checks still prevent the author or inspector from approving their own record.

```sh
PROVISION_EMAIL=operator@example.test \
PROVISION_PASSWORD='replace-with-a-long-unique-password' \
PROVISION_NAME='Print Operator' \
PROVISION_ROLE=OPERATOR \
PROVISION_BASE_IDS=1,2 \
npm --prefix backend run provision-user
```

## Local verification

```sh
npm --prefix backend ci
npm --prefix frontend ci
npm --prefix backend run test:unit
npm --prefix backend run test:integration
npm --prefix frontend run build
./scripts/verify-schema-controls.sh
npm --prefix backend audit --omit=dev --audit-level=low
npm --prefix frontend audit --omit=dev --audit-level=low
```

The integration suite uses real PostgreSQL and distinct operator, quality, and approver identities. It exercises cross-base denial, idempotent and conflicting source events, insufficient inventory rollback, canonical unit validation, delayed telemetry, deterministic quality blockers, explicit risk override, change-order replanning, audit-chain verification, append-only evidence, and retained-work-order deletion failure.

After deploying a base, verify its complete event chain with:

```sh
BASE_ID=1 npm --prefix backend run verify-audit
```

## Deployment

Build the operator console and backend into the unprivileged image with `docker build -t lunarbase-governed .`. The container expects an already migrated external PostgreSQL service and serves both the API and static console on port 3010. It does not contain PostgreSQL or perform startup data mutation.

See [SECURITY.md](SECURITY.md) for access/evidence controls and [docs/OPERATIONS.md](docs/OPERATIONS.md) for telemetry, exception, recovery, and change-order procedures.
