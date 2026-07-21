# Security and evidence model

## Scope and authorization

Only the governed manufacturing API is supported. JWTs are HS256, have explicit issuer/audience, expire after 12 hours, and carry only a subject and token-version claim. Every request reloads the current active user, role, token version, and base grants from PostgreSQL, so deactivation, role changes, grant removal, and token-version rotation take effect immediately.

- `OPERATOR`: receives authoritative lots; authors, releases, reserves, starts, finishes, or cancels work orders; submits change orders.
- `QUALITY`: receives lots and submits inspections, but cannot inspect a work order they authored.
- `APPROVER`: decides inspections and change orders, but cannot approve work they authored or inspected/requested.
- `ADMIN`: can access all bases, but is not exempt from separation of duties.

All list/detail endpoints enforce base scope. Unsupported prototype, generated AI, and legacy mutation surfaces fail closed with HTTP 410.

## Provenance and deterministic controls

Material intake requires a source system, source record, idempotency event, receipt timestamp, and HTTPS certificate from an allowlisted authoritative host. Quality users can quarantine, reject, or explicitly release versioned lots; quarantined/rejected lots cannot be reserved. Print telemetry accepts only named metrics, canonical units, bounded numeric values, non-future timestamps, and idempotent external event IDs. Late telemetry is retained and marked; it is allowed only before inspection submission.

Approval uses stored process limits rather than model output. Rules cover allocated quantity, lot purity, temperature, vibration, produced/measured mass, quality score, defect count, and dimensional variance. Failed rules cannot receive ordinary approval. An independent approver may reject or use the exact risk-acceptance attestation with a substantive recorded reason. No AI provider participates in this decision path.

## Evidence and retention

Every work-order transition creates an append-only JSON snapshot. Per-base manufacturing events are serialized with a PostgreSQL advisory lock and SHA-256 linked to the preceding event. PostgreSQL triggers reject event, snapshot, and telemetry update/deletion; decided inspections cannot change; work-order retention cannot be shortened; legal holds cannot be released through ordinary writes; and retained work orders cannot be deleted. The default evidence retention is ten years.

Run `BASE_ID=<id> npm --prefix backend run verify-audit` on a schedule and after incidents or restoration. Store database backups with equivalent encryption, access controls, and retention.

## Secrets and network boundary

Do not commit `.env`. Rotate any credential ever placed in source or shell history. Use a secret manager for `JWT_SECRET` and database credentials. Terminate TLS at a trusted ingress, allow only configured HTTPS browser origins, and restrict PostgreSQL to the application/migration network. Certificate/evidence URLs are provenance references; the current journey validates their authority but does not download their content.

## Incident response

1. Revoke affected users or increment `token_version`; rotate signing/database secrets if exposed.
2. Preserve database and ingress logs without editing manufacturing evidence.
3. Verify each affected base hash chain and correlate source/telemetry event IDs.
4. Quarantine affected lots and reject or hold undecided work orders through a controlled operational procedure.
5. Record remediation as a change order or new work order; never rewrite a prior approved version.

Production dependency audits for both applications reported zero vulnerabilities on 2026-07-20. CI rejects every production dependency advisory and scans full Git history for secrets on every change.
