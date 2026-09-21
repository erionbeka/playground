# Production Readiness Plan

Playground Life now has a Postgres-backed production API foundation in addition to the existing React application. This document distinguishes between what is implemented, what is validated, and what must still be completed before handling real clinic or child data.

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
- Typed frontend API client under `src/lib/productionApi.ts` and API-backed React provider under `src/context/ApiAppProvider.tsx` for auth, children, families/caregivers, therapy goals, assignments, results, and audit logs.
- Backend API tests under `server/server.test.ts`.

## Commands

```bash
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev:api
npm run dev
```

The API expects `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, and cookie settings in `.env`. The frontend API client uses `VITE_API_URL` and defaults to `http://localhost:4000`. Set `VITE_DATA_MODE=api` to use the API-backed provider.

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
- Backend API tests cover authentication, authorization, child creation, caregiver creation, caregiver reset restrictions, goal creation/status updates, parent-scoped assignment access, caregiver family sessions, result recording restrictions, and audit creation.
- API TypeScript type-checking runs with `npm run typecheck:server`.
- Production build runs with `npm run build`.
- Linting runs with `npm run lint`.
- Production dependency audit runs with `npm audit --omit=dev` and currently reports zero vulnerabilities.

## Security and Data Protection Review Status

Implemented technical controls are not the same as a completed independent review. The application now has the core technical foundation needed for production hardening, plus draft review documents:

- `docs/security-data-protection-review-plan.md`
- `docs/data-governance-policy.md`
- `docs/pilot-validation-protocol.md`

The following must still be completed before real PHI/PII is entered:

- Independent security review or penetration test.
- HIPAA risk analysis or applicable data protection impact assessment.
- Vendor/hosting review and BAA or data-processing agreement where applicable.
- Backup and restore test.
- Incident response procedure approval.
- Access review policy approval.
- Final data retention, deletion, and export procedures.
- Consent and pilot protocol approval.

## Recommended Grant Position

"The platform is complete as a functional application and now includes a self-hosted Postgres production backend foundation with real authentication, role-based authorization, audit logging, structured clinical workflow data storage, a frontend API integration client, backend API tests, and draft security/data-governance/pilot documentation. The grant will support the final production-hardening and evidence-generation steps: independent security/data protection review, pilot deployment, validation reporting, and publication preparation."
