# HIPAA / DPIA Risk Assessment Worksheet

This worksheet is a prepared assessment package for privacy and compliance review. It is not a completed legal or regulatory sign-off until reviewed and approved by the responsible organization, privacy officer, legal counsel, or qualified external reviewer.

## System Scope

Playground Life supports therapist-assigned, play-based learning activities for autistic children. The production architecture includes a React frontend, Node/Express API, PostgreSQL database, role-based authorization, audit logging, and structured storage for clinic, user, child, assignment, result, and audit records.

## Data Subjects

- Children receiving therapy or learning support.
- Parents or caregivers linked to child accounts.
- Therapists and administrators using the clinic workflow.

## Data Categories

- Account data: name, email or phone, role, credential status, password hash, sign-in timestamp.
- Child profile data: name/display name, avatar, birth date, diagnosis field, notes, support needs, interests, goals, personalization profile, skill profile, and progression settings.
- Therapy workflow data: goals, assignments, due dates, difficulty, support levels, therapist approvals, monthly plan metadata, and notes.
- Outcome data: game completion, duration, score, interactions, metrics, and skill scores.
- Audit data: actor, action, entity, timestamp, IP address, user agent, and event details.

## Purpose and Legal/Operational Basis

The intended purpose is therapy-support workflow, family practice continuity, and feasibility/usability evaluation during a controlled pilot. The legal or operational basis must be confirmed by the deploying clinic before pilot launch and reflected in consent materials, data-processing agreements, and retention/deletion procedures.

## Implemented Safeguards

- Server-side authentication with Argon2id password hashing.
- JWT session tokens with HTTP-only cookie support.
- Role-based access control for admin, therapist, and parent/caregiver roles.
- Clinic-scoped database records.
- Server-side request validation using Zod.
- Helmet security headers, CORS allowlist, JSON body-size limit, cookie parsing, and API rate limiting.
- Structured audit logs for key account, child, assignment, approval, and result events.
- Environment-based configuration for secrets, database URL, CORS origin, and cookie security.
- Automated regression tests for authentication, authorization, validation failure, audit access, security headers, and result recording.

## Risk Register

| Risk | Likelihood | Impact | Current Mitigation | Remaining Action |
| --- | --- | --- | --- | --- |
| Unauthorized account access | Medium | High | Password hashing, JWT sessions, role checks, rate limiting | Add MFA policy decision and password reset operating procedure |
| Cross-clinic data exposure | Low | High | Clinic-scoped records and API queries | Add staging E2E tests for cross-clinic isolation |
| Excess child/clinical detail in audit logs | Medium | Medium | Audit details are structured and limited by event | Approve audit data minimization and retention policy |
| Browser demo storage used with real data | Low | High | Production builds disable browser demo persistence unless `VITE_ENABLE_DEMO_STORAGE=true` is explicitly set | Add deployment banner if a hosted demo environment is created |
| Insecure deployment configuration | Medium | High | Environment config validation and cookie security option | Review TLS, cookie security, secrets, database roles, backups, and hosting contracts |
| Data retention/deletion ambiguity | Medium | High | Draft governance policy exists | Approve retention, deletion, export, and de-identification procedures |
| Unreviewed third-party dependency risk | Low | Medium | Production audit currently reports 0 vulnerabilities | Add recurring dependency audit cadence and remediation SLA |
| Pilot consent mismatch | Medium | High | Pilot protocol draft exists | Approve consent language before collecting real participant data |

## Reviewer Checklist

- Confirm whether the deployment is subject to HIPAA, GDPR, local child-data rules, school/clinic policies, or other jurisdiction-specific requirements.
- Confirm whether the hosting/vendor stack requires a BAA or data-processing agreement.
- Review consent language for children, caregivers, therapists, data categories, purpose, retention, deletion, export, and publication use.
- Review database encryption at rest, encrypted backups, TLS, least-privilege database roles, and access logging.
- Review incident response ownership, breach notification path, support contact, and escalation timeline.
- Review child/caregiver access rights and account recovery process.
- Approve pilot go/no-go decision before real data is entered.

## Status Statement

The HIPAA/DPIA review package is implemented as a prepared worksheet. Formal review remains pending until a responsible privacy/security reviewer completes, signs, and files the assessment.
