# Governed manufacturing operations

## Normal journey

1. An operator records a material lot using the authoritative source record and certificate URL. Replayed events return the prior record; a changed replay is rejected. Quality can quarantine or reject suspect lots; release from quarantine requires an exact disposition/evidence attestation.
2. An operator authors a work order with revision, required material/purity, expected mass/tolerance, temperature range, and maximum vibration.
3. Release requires the exact part-revision/process-limit attestation. Reservation locks the work order and lots, verifies same-base/type/purity/available quantity, and commits all quantities atomically.
4. During `IN_PROGRESS`, the printer or operator submits typed telemetry. Finishing requires temperature, vibration, and produced-mass observations.
5. Delayed telemetry may arrive while `AWAITING_INSPECTION` and is visibly marked late. Once inspection begins, telemetry is closed so the decision evidence cannot move underneath reviewers.
6. A different quality user records measurements, findings, and authoritative evidence. The service stores all deterministic rule results and blockers.
7. A different approver approves a clean inspection, rejects it with a reason, or accepts a blocked result only with the exact risk attestation and a detailed reason.

## Disruption and replanning

Reservation failures roll back the entire transaction, including lot quantities. A reserved but not-started order can be cancelled, returning its allocation. Material is marked consumed when printing finishes and is never silently returned.

For a draft, released, or rejected order, submit a change order containing only supported process/design fields, a reason, and an impact assessment. A different approver accepts or rejects it. Acceptance creates a new immutable work-order version in `DRAFT`; prior telemetry, inspection, allocation, and event evidence remains linked to the same work order. If operational policy requires a new physical article rather than reuse of the identifier, create a new work order and reference the rejected code in its description.

## Deployment and recovery

Back up PostgreSQL before migration and store the migration checksum with release evidence. Apply migrations once as a deployment job, run `scripts/verify-schema-controls.sh`, then start the container. A second migration run must report `already applied`.

For recovery, restore to an isolated PostgreSQL 16 instance, apply any later checked-in migrations, run the schema-control verifier, then verify every affected base audit chain. Do not promote the restored database if any hash chain fails. Repoint the application only after the database owner and mission/quality owners sign off. Startup itself never migrates or seeds, preventing an application restart from mutating restored data.

## Launch validation

Before a real deployment, exercise representative supplier certificates and printer telemetry, clock skew and delayed batches, multiple-lot reservations, network loss/retry, quarantine decisions, evidence-host downtime, backup restoration, legal-hold placement/release, and exports with mission operations, quality, safety, security, and records owners. The repository implements the technical controls; it does not select an organization’s authoritative suppliers, acceptance limits, retention law, or risk-acceptance authority.
