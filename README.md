# Playground Life

Playground Life is a clinic-ready application for assigning, playing, and reviewing structured learning activities for autistic children. It supports separate admin, therapist, and family workflows and now includes a self-hosted Postgres production backend foundation.

## What the App Does

- Lets clinic administrators manage staff access, family onboarding states, credential resets, and audit activity.
- Lets therapists create child profiles, capture goals and support needs, assign homework/classwork, approve or adjust progression, and review outcome reports.
- Lets families sign in, view today's session, complete assigned games, and generate play results that flow back into therapist review.
- Provides a catalog of 192 structured activities across matching, sequencing, sorting, tapping, social practice, building, color/shape recognition, counting, memory, emotion, language, motor, and daily-living domains.
- Uses explainable personalization logic to recommend difficulty, support level, activity categories, monthly plans, and progression decisions.
- Adds a Node/Express API with PostgreSQL, Argon2id password hashing, JWT sessions, role-based authorization, request validation, and audit logging.

## Production Backend

The production backend lives in `server/` and uses PostgreSQL rather than Supabase.

```bash
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev:api
npm run dev
```

Key scripts:

- `npm run dev:api`: start the API server.
- `npm run db:migrate`: create/update the Postgres schema.
- `npm run db:seed`: create an initial clinic admin account.
- `npm run typecheck:server`: type-check backend code.

## Data Stored

The Postgres schema stores clinics, admin/therapist/parent users, child profiles, family-child links, therapy goals, assignments, game results, and audit logs. Passwords are stored as Argon2id hashes. Audit logs include actor, action, entity, timestamp, IP address, user agent, and structured details.

The browser `localStorage` demo state remains available for local UI demonstration only. Real clinic or child data should use the Postgres backend, not browser demo storage.

## Validation Status

Validation to date is technical and workflow-focused:

- Unit and component tests cover personalization helpers, monthly-plan logic, therapist workflows, family sign-in, admin credential controls, reporting defaults, and all game engine smoke paths.
- Backend type-checking covers the Postgres API foundation.
- Build verification is run with `npm run build` using Vite.

No clinical efficacy claims should be made until a documented pilot is completed. A pilot with security/privacy review, consent materials, deployment logging, and pre-defined outcome measures remains the next evidence step.

## Security and Data Protection Review

Implemented safeguards include server-side auth, Argon2id password hashing, JWT sessions with HTTP-only cookie support, RBAC, clinic-scoped Postgres records, request validation, security middleware, and audit logging.

The platform has not yet completed an independent security audit, HIPAA risk analysis, DPIA, penetration test, or formal data protection review. Those reviews should be completed before live clinical deployment with real PHI/PII.

## Grant/Reviewer Note

Grant-safe wording:

"The platform is complete as a functional application and now includes a self-hosted Postgres production backend foundation with real authentication, role-based authorization, audit logging, and structured clinical workflow data storage. The grant will support the final production-hardening and evidence-generation steps: independent security/data protection review, pilot deployment, validation reporting, and publication preparation."
