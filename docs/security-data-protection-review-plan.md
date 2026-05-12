# Security and Data Protection Review Plan

This document defines the review package required before Playground Life is deployed with real clinic, child, caregiver, or protected health information.

## Current Technical Controls

- Server-side authentication with Argon2id password hashing.
- JWT sessions with HTTP-only cookie support.
- Role-based access control for admin, therapist, and parent users.
- Clinic-scoped PostgreSQL schema.
- Server-side request validation with Zod.
- Helmet security headers, CORS allowlist, JSON body size limits, and API rate limiting.
- Audit logging for sign-in, sign-out, staff creation, child creation, assignment creation, approval, and result recording.
- Environment-based secret management through `.env`.
- Production dependency audit reports 0 production dependency vulnerabilities with `npm audit --omit=dev` as of the 2026-05-12 verification run.

## Review Required Before Live Clinical Data

- Threat model review covering authentication, authorization, data flows, audit logs, caregiver access, and reporting exports.
- Dependency audit review for production and development dependencies.
- Static code review for injection, broken access control, sensitive data exposure, and insecure direct object references.
- API authorization testing across admin, therapist, and parent roles.
- Database access review for least-privilege roles, backup encryption, and restoration procedure.
- Hosting/vendor review and BAA or data-processing agreement where applicable.
- Privacy review covering consent, retention, deletion, export, incident response, and family access rights.
- Accessibility review for child- and caregiver-facing flows.
- Pilot safety review before deployment beyond internal testing.

## Minimum Evidence to File

- Date and scope of review.
- Reviewer name or organization.
- Application version or commit hash.
- Test environment description.
- Findings list with severity and remediation owner.
- Remediation evidence.
- Final go/no-go decision for pilot deployment.

## Implemented Review Package

- `docs/security-review-evidence-register.md`
- `docs/hipaa-dpia-risk-assessment.md`
- `docs/penetration-test-plan.md`
- `docs/pilot-evidence-template.md`
- Expanded API security regression coverage in `server/server.test.ts`

## Grant-Safe Status Statement

Core security and privacy architecture has been implemented in the software. A formal independent security and data protection review has not yet been completed and should be funded and completed before live deployment with real PHI/PII.
