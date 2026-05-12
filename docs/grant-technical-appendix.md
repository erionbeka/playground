# Playground Life Grant Technical Appendix

## 1. What the Platform Actually Does

Playground Life is a clinic-facing therapy-support and learning platform for autistic children. It connects clinic administrators, therapists, and families around structured play-based practice, home/classroom continuity, progress review, and documented assignment outcomes.

The implemented application includes:

- Admin workflow: clinic administrator sign-in, staff account creation, family onboarding status, invite issuance, credential reset controls, readiness notes, and audit activity.
- Therapist workflow: caseload overview, child profiles, therapy goals, family member records, personalization settings, homework/classwork assignment, monthly progressive planning, approval/adjustment of assignments, outcome review, and report generation.
- Family workflow: family sign-in, assigned homework/classwork, today's session view, activity completion, and result submission for therapist review.
- Activity catalog: 192 structured activities across playground/social play, matching, sequencing, sorting, tapping, construction/building, colors and shapes, counting, memory, emotions, language, motor, and daily-living practice.
- Personalization engine: rule-based recommendations using child profile fields, therapy goals, clinical support ratings, recent scores, prompt needs, regulation signals, transition difficulty, recent activity categories, and generalization needs.
- Production backend: self-hosted Node/Express API with PostgreSQL, server-side authentication, role-based authorization, request validation, audit logging, and clinic-scoped data tables.
- Frontend API integration: typed client methods for login, logout, session lookup, staff creation, child records, assignments, assignment approval, game-result recording, and audit-log retrieval.
- Reporting: generated clinical progress reports with assignment details, outcome metrics, monthly-plan review, skill focus, and recommendation summaries.

## 2. What Data It Stores

The production PostgreSQL schema stores the following categories of data:

- Clinic records: clinic ID, clinic name, creation/update timestamps.
- Users: admin, therapist, and parent/caregiver accounts; name; email or phone; role; credential status; Argon2id password hash; last sign-in; timestamps.
- Child profiles: child ID, clinic ID, first/display name, avatar, birth date, diagnosis field, notes, personalization profile, skill profile, and progression settings.
- Family-child relationships: linked caregiver, relationship, invitation date, invite-code hash, and clinic scope.
- Therapy goals: child ID, domain, title, target level, status, notes, timestamps.
- Assignments: child ID, assigned caregiver, homework/classwork type, game IDs, difficulty, play mode, notes, due date, status, skill focus, support level, system-suggested difficulty, therapist approval, approval metadata, monthly-plan metadata, and creator.
- Game results: assignment ID, child ID, game ID, completion time, duration, score, interaction count, structured metrics, and skill scores.
- Audit logs: clinic ID, actor, actor role, action, entity type, entity ID, structured details, IP address, user agent, and timestamp.

Browser demo persistence is disabled in production builds unless explicitly enabled with `VITE_ENABLE_DEMO_STORAGE=true`. The production data path uses the PostgreSQL API.

## 3. How It Was Validated

The platform has software, workflow, and technical-readiness validation through automated tests, type-checking, linting, production build verification, and dependency audit.

Latest verification run on 2026-05-12:

- `npm test`: passed, 4 test files and 231 automated tests.
- `npm run typecheck:server`: passed.
- `npm run build`: passed.
- `npm run lint`: passed with 0 errors and 0 warnings.
- `npm audit --omit=dev`: passed with 0 production dependency vulnerabilities.

Automated validation covers:

- Personalization helper tests for difficulty adjustment, readiness state, category rotation, monthly difficulty planning, and outcome recommendations.
- Workflow tests for child removal, family credential creation, reusable goal templates, legacy profile normalization, monthly homework plan creation, recommendation explanations, family sign-in, classwork display, today's session view, admin invite/credential controls, admin sign-in rendering, therapist caseload sign-in, and quick-review reporting mode.
- Game-engine smoke tests covering the full configured activity catalog and completion path.
- Regression tests for recognition, sorting, tapping, and building engines.
- Backend API tests for valid login, invalid credentials, security headers, HTTP-only/SameSite session cookies, authentication requirements, role restrictions, child creation, request validation, parent assignment restrictions, parent child-list and assignment-list scoping, assignment creation scope checks, game-result recording, unlinked-assignment blocking, audit-log restrictions, and audit event creation.
- Server TypeScript type-checking for the production API foundation.
- Vite production build verification.
- ESLint verification with no errors or warnings.
- Production dependency audit with no production vulnerabilities.

## 4. Security and Data Protection Review

Implemented security and data-protection controls include:

- Server-side authentication with Argon2id password hashing.
- JWT sessions with HTTP-only cookie support.
- SameSite session cookie configuration.
- Role-based authorization for admin, therapist, and parent/caregiver roles.
- Clinic-scoped PostgreSQL data model.
- Parent/caregiver access scoped to linked children and assigned/linked assignments.
- Result submission scoped to authorized linked assignments.
- Assignment creation checks that child and assigned caregiver records are valid within the clinic/family scope.
- Server-side request validation with Zod.
- Security middleware including Helmet, CORS allowlist, body-size limits, cookie parsing, and rate limiting.
- Structured audit logging for sign-in, sign-out, staff creation, child creation, assignment creation, assignment approval, and game-result recording.
- Environment-based configuration for secrets, database URL, CORS origin, and cookie security.
- Production browser demo-storage gating through `VITE_ENABLE_DEMO_STORAGE`.

Operational readiness artifacts in the repository include:

- Security/data protection review plan: `docs/security-data-protection-review-plan.md`.
- Data governance policy: `docs/data-governance-policy.md`.
- Security evidence register: `docs/security-review-evidence-register.md`.
- HIPAA/DPIA risk assessment worksheet: `docs/hipaa-dpia-risk-assessment.md`.
- Penetration-test plan and evidence log: `docs/penetration-test-plan.md`.
- Backup, restore, and disaster recovery procedure: `docs/backup-restore-disaster-recovery-procedure.md`.
- Incident response policy: `docs/incident-response-policy.md`.
- Access review and least-privilege operating procedure: `docs/access-review-least-privilege-procedure.md`.
- Data retention, deletion, and export policy: `docs/data-retention-deletion-export-policy.md`.
- Consent and pilot approval procedure: `docs/consent-and-pilot-approval-procedure.md`.
- Pilot validation protocol: `docs/pilot-validation-protocol.md`.
- Pilot evidence template: `docs/pilot-evidence-template.md`.

Implemented database operations scripts include:

- `npm run db:migrate`: applies the PostgreSQL schema.
- `npm run db:seed`: creates an initial clinic/admin seed dataset.
- `npm run db:backup`: creates a timestamped PostgreSQL custom-format backup.
- `npm run db:restore:test`: restores a backup into a restore-test database and verifies required tables.
- `npm run db:drill`: runs backup and restore-test verification together.

The restore-test script includes a safety guard requiring the restore target database name to contain `test`, `restore`, `drill`, or `staging`.

## 5. Publication and Pilot Context

Playground Life is presented as a completed functional application with technical validation, security/data-protection controls, and a pilot-ready evidence framework. The platform's current documentation is designed to make its implementation concrete and reviewable even where reviewers ask for prior pilot or publication context.

The repository includes a controlled pilot protocol and evidence-capture framework designed for feasibility, usability, workflow-fit, safety, privacy, and adherence evaluation. Implemented pilot documentation includes:

- Pilot purpose and suggested design.
- Participant and setting parameters.
- Primary evaluation questions.
- Feasibility and usability measures.
- Assignment adherence and session completion measures.
- Therapist usefulness ratings.
- Caregiver usability ratings.
- Safety/privacy/support issue logging.
- Pilot summary structure.
- Publication framing for feasibility/usability evidence.

The technical appendix therefore documents the implemented product directly: role-separated workflows, structured child profiles, therapist-controlled assignments, family-facing practice sessions, explainable recommendations, progress reporting, real server-side authentication, role-based authorization, audit history, backup/restore drill tooling, operational policies, validation results, and pilot evidence templates.

This provides reviewers with a concrete technical basis for assessing the platform as built: what it does, what it stores, how it is validated, what security/data-protection controls and review artifacts exist, and how pilot evidence is structured for documentation and publication.

## Grant-Ready Short Response

Playground Life is a completed functional application for therapist-assigned, play-based learning support for autistic children. It provides administrator, therapist, and family workflows; a structured 192-activity catalog; child profiles; goal tracking; personalized homework/classwork assignment; family session completion; progress reporting; and audit history.

The platform includes a self-hosted production backend using PostgreSQL, server-side authentication, Argon2id password hashing, JWT sessions, role-based access control, request validation, clinic-scoped records, parent/caregiver access scoping, audit logging, frontend API integration methods, backup/restore drill tooling, and operational readiness procedures.

The system stores clinic users, caregiver accounts, child profiles, family-child relationships, therapy goals, assignments, game results, personalization fields, clinical support ratings, and audit events in PostgreSQL. Production browser demo persistence is disabled unless explicitly enabled.

The platform has been validated through automated software tests and workflow checks, including personalization logic, monthly plan generation, family sign-in, admin credential workflows, reporting flows, game-engine smoke coverage, backend authentication/authorization tests, parent/caregiver data-scoping tests, security-header/session-cookie tests, server type-checking, production build verification, linting with 0 errors and 0 warnings, and production dependency audit with 0 vulnerabilities. The latest validation pass includes 231 automated tests.
