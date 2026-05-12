# Data Governance Policy Draft

This draft describes how Playground Life should govern production data during pilot and clinical deployment.

## Data Categories

- Account data: names, emails, phone numbers, roles, credential status, password hashes, and sign-in timestamps.
- Child profile data: name/display name, age or birth date, diagnosis field, notes, support needs, interests, goals, and personalization profile.
- Therapy workflow data: assignments, game IDs, due dates, support levels, therapist approval status, and monthly plan metadata.
- Outcome data: game completion, duration, score, interactions, prompts, regulation metrics, communication attempts, independence, transition ease, and skill scores.
- Audit data: actor, action, entity, timestamp, IP address, user agent, and structured event details.

## Access Rules

- Admins may manage clinic staff, family onboarding, and audit/review workflows.
- Therapists may manage children, goals, assignments, approvals, progress review, and reports within their clinic.
- Parents/caregivers may access only assigned family-facing sessions and child records explicitly linked to them.
- Cross-clinic access is prohibited by clinic-scoped records and must be verified in API tests before production.

## Retention and Deletion

- Pilot data retention should be defined in consent materials before enrollment.
- Families should be told what data is collected, why it is collected, who can access it, and how deletion/export requests are handled.
- Deletion requests should remove or de-identify child/caregiver records unless retention is legally required.
- Audit logs should have a defined retention period and should not store unnecessary clinical detail.

## Operational Requirements

- Use managed PostgreSQL with encryption at rest and encrypted backups.
- Enforce TLS for all application traffic.
- Store secrets outside source control.
- Rotate seed/admin credentials after deployment.
- Review staff access on a scheduled basis.
- Test backup restoration before pilot launch.
- Maintain an incident response contact and escalation procedure.

## Grant-Safe Status Statement

A data governance model has been drafted and the software now supports clinic-scoped storage and audit logging. Final policies, consent language, retention periods, and data-processing agreements should be approved before pilot deployment.
