# Security and Data Protection Evidence Register

This register tracks what has been implemented internally and what still requires independent review or live pilot execution. It should be updated whenever review evidence is added.

## Current Status

| Area | Status | Evidence in Repo | External Evidence Still Needed |
| --- | --- | --- | --- |
| Application security controls | Implemented internally | `server/index.ts`, `server/middleware.ts`, `server/auth.ts`, `server/sql/001_init.sql`, `server/server.test.ts` | Independent security review report |
| Authentication and session controls | Implemented internally | Argon2id hashing, JWT sessions, HTTP-only cookie tests | Reviewer confirmation and deployment config review |
| Role-based access control | Implemented internally | API middleware and regression tests for admin/therapist/parent restrictions | Reviewer confirmation and cross-clinic access testing in staging |
| Audit logging | Implemented internally | `server/audit.ts`, audit route, audit regression tests | Review of audit retention and operational monitoring |
| HIPAA risk analysis / DPIA | Prepared, not externally approved | `docs/hipaa-dpia-risk-assessment.md` | Signed HIPAA risk analysis or DPIA by responsible privacy/security reviewer |
| Penetration test | Prepared, not executed independently | `docs/penetration-test-plan.md` | Penetration-test report with findings and remediation evidence |
| External pilot | Prepared, not yet run | `docs/pilot-validation-protocol.md`, `docs/pilot-evidence-template.md` | Consent records, deployment logs, issue log, outcome dataset, pilot summary |
| Publication evidence | Planned | `docs/reviewer-response.md`, `docs/grant-technical-appendix.md` | Completed pilot analysis and manuscript/report |
| Backup/restore and disaster recovery | Procedure and drill tooling implemented | `server/backupRestoreDrill.ts`, `docs/backup-restore-disaster-recovery-procedure.md` | Restore drill evidence from staging or production-equivalent database |
| Incident response | Policy prepared | `docs/incident-response-policy.md` | Approved incident response owner list and signed policy |
| Access review and least privilege | Procedure prepared; app controls implemented | `docs/access-review-least-privilege-procedure.md`, `server/server.test.ts` | Completed access review log and deployment/database role review |
| Retention/deletion/export | Policy prepared | `docs/data-retention-deletion-export-policy.md` | Approved retention periods and request-handling owner |
| Consent and pilot approval | Procedure prepared | `docs/consent-and-pilot-approval-procedure.md` | Approved consent materials and pilot launch decision |

## Internal Verification Run

Latest local verification run: 2026-05-12.

- `npm test`: passed, 4 test files and 231 automated tests.
- `npm run typecheck:server`: passed.
- `npm run build`: passed.
- `npm run lint`: passed with 0 errors and 0 warnings.
- `npm audit --omit=dev`: passed with 0 production dependency vulnerabilities.

## Completion Criteria for External Review

Before the status can honestly change from "prepared" to "completed," the project needs the following filed evidence:

- Independent reviewer name or organization.
- Review date, scope, environment, version, and commit hash.
- Findings with severity, owner, remediation date, and retest status.
- Formal go/no-go decision for pilot deployment with real data.
- Approved consent, retention, deletion, export, incident response, and access review procedures.
