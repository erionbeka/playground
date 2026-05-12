# Reviewer Response: Platform Function, Data, Validation, and Review Status

This document gives direct, grant-safe answers to common reviewer questions. It reflects the current implementation in the React application, Node/Express API, PostgreSQL schema, automated tests, and documentation set.

## 1. What It Actually Does

Playground Life is a functional therapy-support platform for autistic children, designed around the relationship between clinic administrators, therapists, and families.

Implemented workflows include:

- Administrators can sign in, manage staff/family access, issue invites, reset credentials, review onboarding readiness, and view audit activity.
- Therapists can manage child profiles, therapy goals, personalization settings, homework/classwork assignments, monthly plans, assignment approval, outcome review, and generated reports.
- Families can sign in, see assigned sessions, complete structured play activities, and submit results for therapist review.
- The activity catalog includes 192 structured games across matching, sequencing, sorting, tapping, building, recognition, counting, memory, emotion, language, motor, social, daily-living, and playground-practice domains.
- The personalization layer is explainable and rule-based. It recommends activity categories, difficulty, support levels, progression decisions, and monthly plans from profile fields, goals, recent outcomes, prompts/support needs, regulation signals, transitions, and category rotation.
- The production backend foundation provides a self-hosted Node/Express API with PostgreSQL storage, Argon2id password hashing, JWT sessions, role-based authorization, request validation, clinic-scoped records, and audit logging.

The current claim should be: the platform is built as a functional application with production backend infrastructure and pilot-ready documentation. It should not yet be described as a clinically proven intervention.

## 2. What Data It Stores

The production database schema in `server/sql/001_init.sql` stores:

- Clinic records: clinic ID, name, and timestamps.
- User accounts: admin, therapist, and parent/caregiver role; name; email or phone; credential status; Argon2id password hash; last sign-in; timestamps.
- Child profiles: first/display name, avatar, birth date, diagnosis field, notes, personalization profile, skill profile, progression settings, clinic ID, and timestamps.
- Family-child links: caregiver/child relationship, invite timestamp, invite-code hash, user ID, child ID, and clinic ID.
- Therapy goals: child ID, domain, title, target level, status, notes, and timestamps.
- Assignments: child ID, assigned caregiver, homework/classwork type, game IDs, difficulty, play mode, notes, due date, status, skill focus, support level, system recommendation, therapist approval state, approval metadata, monthly-plan metadata, creator, and timestamps.
- Game results: assignment ID, child ID, game ID, completion timestamp, duration, score, interaction count, structured metrics, and skill scores.
- Audit logs: clinic ID, actor user ID, actor role, action, entity type, entity ID, structured details, IP address, user agent, and timestamp.

The app also has browser `localStorage` demo state for local demonstrations and automated UI workflow tests. Real clinic, child, caregiver, PHI, or PII data should use the Postgres backend and should not be entered into browser-only demo storage.

## 3. How It Was Validated

Validation to date is software, workflow, and technical-readiness validation. It is not clinical efficacy validation.

Verification run on 2026-05-12:

- `npm test`: passed, 4 test files and 231 automated tests.
- `npm run typecheck:server`: passed.
- `npm run build`: passed.
- `npm run lint`: passed with 0 errors and 0 warnings.
- `npm audit --omit=dev`: passed with 0 production dependency vulnerabilities.

The automated test coverage includes:

- Backend API authentication, invalid credentials, role restrictions, child creation, parent assignment restrictions, game-result recording, and audit event creation.
- Frontend workflow coverage for therapist caseloads, family sign-in, admin credential/invite controls, classwork/homework display, reporting mode, monthly homework planning, and recommendation explanations.
- Personalization helper coverage for difficulty adjustment, readiness state, category rotation, monthly planning, and outcome recommendations.
- Game-engine smoke coverage for the full configured activity catalog, plus regression checks for recognition, sorting, tapping, and building engines.

Recommended next validation before public clinical claims:

- Run migration and seed scripts against a clean staging Postgres instance.
- Add end-to-end tests against the API-backed staging environment.
- Complete the pilot protocol in `docs/pilot-validation-protocol.md`.
- Produce a pilot summary with consent records, issue logs, usability/adherence metrics, and release notes.

## 4. Security and Data Protection Review Status

Implemented security and privacy-relevant controls include:

- Argon2id password hashing.
- JWT sessions with HTTP-only cookie support.
- Role-based authorization for admin, therapist, and parent roles.
- Clinic-scoped PostgreSQL records.
- Server-side request validation with Zod.
- Helmet security headers, CORS allowlist, JSON body-size limits, cookie parsing, and API rate limiting.
- Structured audit logging for sign-in, sign-out, staff creation, child creation, assignment creation, assignment approval, and result recording.
- Environment-based configuration for database URL, JWT secret, CORS origin, and cookie security.
- Draft security/data protection review plan and draft data governance policy.

A formal independent security or data protection review has not yet been completed. The repo now includes prepared review work products for that process: `docs/security-review-evidence-register.md`, `docs/hipaa-dpia-risk-assessment.md`, `docs/penetration-test-plan.md`, and `docs/pilot-evidence-template.md`. Before real clinical deployment or entry of real PHI/PII, the project should still complete an independent security review or penetration test, HIPAA risk analysis or applicable DPIA, hosting/vendor review, BAA or data-processing agreements where applicable, backup/restore testing, incident response approval, access review, retention/deletion/export policy approval, and pilot consent review.

## 5. Why There Is No Prior Publication or Documented Pilot

The absence of a prior publication should be framed as a stage-of-evidence issue, not a lack of implementation.

Suggested wording:

"Playground Life has been built as a completed functional application with a self-hosted Postgres backend foundation rather than as a previously published clinical intervention. The current software establishes the technical foundation: role-separated workflows, structured child profiles, therapist-controlled assignments, family-facing practice sessions, explainable recommendations, progress reporting, real server-side authentication, role-based authorization, audit history, and pilot-ready documentation. The absence of a prior publication reflects the project's current evidence-generation stage. The proposed grant will fund the next phase: formal security and data protection review, controlled pilot deployment, structured usability and feasibility evaluation, and preparation of publishable findings."

The first publication should be positioned as a feasibility and usability report. Clinical effectiveness claims should wait until after feasibility, privacy, security, and operational controls are established and a later effectiveness study is completed.
