# Production Readiness Plan

Playground Life now has a Postgres-backed production API foundation in addition to the existing React application prototype. This document distinguishes between what is implemented, what is ready for controlled deployment, and what must still be completed before handling real clinic or child data.

## Implemented Production Foundation

- Node/Express API under `server/`.
- PostgreSQL schema migration under `server/sql/001_init.sql`.
- Real server-side authentication with Argon2id password hashing.
- JWT-based sessions with HTTP-only cookie support.
- Role-based access control for `admin`, `therapist`, and `parent` roles.
- Clinic-scoped data model for users, children, family-child links, therapy goals, assignments, game results, and audit logs.
- Server-side request validation with Zod.
- Security middleware: Helmet, CORS allowlist, JSON body size limits, cookie parsing, and rate limiting.
- Server-side audit logging for sign-in, sign-out, staff creation, child creation, assignment creation, assignment approval, and game result recording.
- Migration and seed scripts for a self-hosted Postgres environment.

## Commands

```bash
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev:api
npm run dev
```

The API expects `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, and cookie settings in `.env`.

## Data Stored in Postgres

The production schema stores:

- Clinics and clinic configuration.
- Admin, therapist, and parent/caregiver users.
- Argon2id password hashes, credential status, and last sign-in timestamps.
- Child profiles, diagnosis field, notes, personalization profile, skill profile, and progression settings.
- Family-child relationships and invite metadata.
- Therapy goals and goal status.
- Homework/classwork assignments, game IDs, difficulty, mode, due dates, support levels, skill focus, therapist approval state, and monthly-plan metadata.
- Game results including duration, score, interaction count, metrics, and skill scores.
- Audit logs with actor, action, entity, timestamp, IP, user agent, and structured details.

## Validation Completed

- Existing frontend tests cover app workflows, personalization logic, reporting behavior, and game-engine smoke coverage.
- API TypeScript type-checking should be run with `npm run typecheck:server`.
- Production build should be run with `npm run build`.
- Linting should be run with `npm run lint`.
- Database migration should be tested against a clean Postgres database and a staging clone before production.

## Security and Data Protection Review Status

Implemented technical controls are not the same as a completed independent review. The application now has the core technical foundation needed for production hardening, but the following must be completed before real PHI/PII is entered:

- Independent security review or penetration test.
- HIPAA risk analysis or applicable data protection impact assessment.
- Vendor/hosting review and BAA or data-processing agreement where applicable.
- Dependency audit triage and remediation plan.
- Backup and restore test.
- Incident response procedure.
- Access review policy.
- Data retention, deletion, and export procedures.
- Consent and pilot protocol review.

## Recommended Grant Position

The strongest accurate position is:

"The platform is complete as a functional application and now includes a self-hosted Postgres production backend foundation with real authentication, role-based authorization, audit logging, and structured clinical workflow data storage. The grant will support the final production-hardening and evidence-generation steps: independent security/data protection review, pilot deployment, validation reporting, and publication preparation."
