# Playground Life Grant Technical Appendix

## 1. What the Platform Actually Does

Playground Life is a clinic-facing therapy-support and learning platform for autistic children. It connects administrators, therapists, and families around structured play-based practice.

The implemented application includes:

- Admin workflow: clinic administrator sign-in, staff account creation, family onboarding status, invite issuance, credential reset controls, readiness notes, and audit activity.
- Therapist workflow: caseload overview, child profiles, therapy goals, family member records, personalization settings, homework/classwork assignment, monthly progressive planning, approval/adjustment of assignments, outcome review, and report generation.
- Family workflow: family sign-in, assigned homework/classwork, today's session view, activity completion, and results that flow back into therapist review.
- Game catalog: 192 structured activities across playground/social play, matching, sequencing, sorting, tapping, construction/building, colors and shapes, counting, memory, emotions, language, motor, and daily-living practice.
- Personalization engine: rule-based recommendations that consider child profile fields, goals, clinical support ratings, recent scores, prompt needs, regulation signals, transition difficulty, recent activity categories, and generalization needs.
- Production backend foundation: self-hosted Node/Express API with PostgreSQL, server-side authentication, role-based authorization, request validation, audit logging, and clinic-scoped data tables.
- Frontend integration surface: a typed API client for login, logout, session lookup, staff creation, child records, assignments, assignment approval, game-result recording, and audit-log retrieval.

The product should be described as a completed functional application with production backend infrastructure and integration pathways. It should not be described as a clinically proven intervention or as having completed independent compliance review until the pilot and formal reviews are complete.

## 2. What Data It Stores

The production Postgres schema stores the following categories of data:

- Clinic records: clinic ID, clinic name, creation/update timestamps.
- Users: admin, therapist, and parent/caregiver accounts; name; email or phone; role; credential status; Argon2id password hash; last sign-in; timestamps.
- Child profiles: child ID, clinic ID, first/display name, avatar, birth date, diagnosis field, notes, personalization profile, skill profile, and progression settings.
- Family-child relationships: linked caregiver, relationship, invitation date, invite-code hash, and clinic scope.
- Therapy goals: child ID, domain, title, target level, status, notes, timestamps.
- Assignments: child ID, assigned caregiver, homework/classwork type, game IDs, difficulty, play mode, notes, due date, status, skill focus, support level, system-suggested difficulty, therapist approval, approval metadata, monthly-plan metadata, and creator.
- Game results: assignment ID, child ID, game ID, completion time, duration, score, interaction count, structured metrics, and skill scores.
- Audit logs: clinic ID, actor, actor role, action, entity type, entity ID, structured details, IP address, user agent, and timestamp.

The original browser `localStorage` layer remains available for local UI demonstration and automated workflow tests. Production or pilot data should use the Postgres API. Real clinic or child data should not be entered into browser-only demo storage.

## 3. How It Was Validated

Validation completed so far is software and workflow validation:

- Automated frontend tests with Vitest and React Testing Library.
- Personalization helper tests covering difficulty adjustment, readiness state, category rotation, monthly difficulty planning, and outcome recommendations.
- Workflow tests covering child removal, family credential creation, reusable goal templates, legacy profile normalization, monthly homework plan creation, recommendation explanations, family sign-in, classwork display, today's session view, admin invite/credential controls, admin sign-in rendering, therapist caseload sign-in, and quick-review reporting mode.
- Game-engine smoke tests that exercise the full game catalog and confirm each configured activity can reach completion.
- Regression tests for recognition, sorting, tapping, and building engines.
- Backend API tests covering valid login, invalid credentials, role restrictions, child creation, parent restrictions on assignment creation, game-result recording, and audit event creation.
- Backend TypeScript type-checking for the Postgres API foundation.
- Production build verification with Vite.
- Production dependency audit using `npm audit --omit=dev`, currently reporting zero production vulnerabilities.

Recommended next validation before public clinical claims:

- Run the API migration and seed process against a clean staging Postgres database.
- Add end-to-end browser tests that exercise the frontend against the API-backed staging environment.
- Complete the documented pilot described in `docs/pilot-validation-protocol.md`.
- Maintain consent materials, issue logs, release notes, and a pilot summary report.

## 4. Security and Data Protection Review Status

Implemented security-relevant controls now include:

- Server-side authentication using Argon2id password hashing.
- JWT sessions with HTTP-only cookie support.
- Role-based authorization for admin, therapist, and parent roles.
- Clinic-scoped Postgres data model.
- Server-side input validation with Zod.
- Security middleware including Helmet, CORS allowlist, body-size limit, and rate limiting.
- Structured audit logging for key access and data-change events.
- Environment-based configuration for secrets, database URL, CORS origin, and cookie security.
- Draft security/data protection review plan in `docs/security-data-protection-review-plan.md`.
- Draft data governance policy in `docs/data-governance-policy.md`.

A formal independent security or data protection review has not yet been completed. Before real PHI/PII or clinic deployment, the project should complete:

- Independent security review or penetration test.
- HIPAA risk analysis or applicable data protection impact assessment.
- Hosting/vendor review and BAA or data-processing agreement where applicable.
- Backup/restore test and disaster recovery procedure.
- Incident response policy approval.
- Access review and least-privilege operating procedure.
- Final data retention, deletion, and export policy.
- Consent and pilot protocol approval.

The grant-safe answer is that the platform has implemented core security architecture and has a review plan, but formal security/data protection review is a planned production-readiness activity and should be completed before live deployment with real clinical data.

## 5. Publication and Pilot Status

There is not yet a prior peer-reviewed publication or documented external pilot to cite. This should be addressed directly.

Suggested grant wording:

"Playground Life has been built as a completed functional application with a self-hosted Postgres backend foundation rather than as a previously published clinical intervention. The current software establishes the technical foundation: role-separated workflows, structured child profiles, therapist-controlled assignments, family-facing practice sessions, explainable recommendations, progress reporting, real server-side authentication, role-based authorization, audit history, and pilot-ready technical documentation. The absence of a prior publication reflects the project's stage of evidence generation, not the absence of implemented functionality. The proposed grant will fund the next evidence-generating phase: formal security and data protection review, controlled pilot deployment, structured usability and feasibility evaluation, and preparation of publishable findings."

A pilot protocol draft is included at `docs/pilot-validation-protocol.md`. The first appropriate publication should be framed as feasibility/usability evidence, not clinical efficacy. A later study can evaluate clinical effectiveness once feasibility, privacy, and operational controls are established.

## Grant-Ready Short Response

Playground Life is a completed functional application for therapist-assigned, play-based learning support for autistic children. It provides administrator, therapist, and family workflows; a structured activity catalog; child profiles; goal tracking; personalized homework/classwork assignment; family session completion; progress reporting; and audit history. The platform includes a self-hosted production backend foundation using PostgreSQL, server-side authentication, Argon2id password hashing, role-based access control, request validation, frontend API integration methods, and audit logging.

The system stores clinic users, caregiver accounts, child profiles, family-child relationships, therapy goals, assignments, game results, personalization fields, clinical support ratings, and audit events. In production, these records are stored in Postgres. The browser-only local demo state remains for demonstration and testing and should not be used for real PHI/PII.

The platform has been validated through automated software tests and workflow checks, including personalization logic, monthly plan generation, family sign-in, admin credential workflows, reporting flows, full smoke coverage of the activity catalog, and backend API authorization/authentication tests. The latest validation pass includes 222 automated tests, server type-checking, production build verification, linting with no errors, and zero production dependency vulnerabilities.

The platform has implemented core security architecture and has draft data-governance and review plans, but it has not yet completed an independent security audit, HIPAA risk analysis, DPIA, or formal data protection review. Those reviews should be completed before real-world clinical deployment.

The lack of prior publication should be framed as a stage-of-evidence issue: the product is built, but the grant funds the formal pilot, security/privacy review, and publication-quality validation needed to document its effectiveness and readiness for broader clinical use.
