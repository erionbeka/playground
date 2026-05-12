# Access Review and Least-Privilege Operating Procedure

This procedure defines how Playground Life user access, administrative privileges, database privileges, and operational credentials should be granted, reviewed, and revoked.

## Access Principles

- Grant the minimum access needed for the role.
- Separate admin, therapist, parent/caregiver, database, and deployment privileges.
- Use named accounts, not shared accounts.
- Remove access promptly when staff leave the pilot or clinic.
- Review privileged access before pilot launch and on a recurring schedule.

## Application Roles

| Role | Allowed Access | Restrictions |
| --- | --- | --- |
| Admin | Staff creation, family onboarding controls, audit review, child/profile oversight within clinic | No cross-clinic access |
| Therapist | Child profiles, goals, assignments, approvals, reports, audit review within clinic | No staff creation unless explicitly admin |
| Parent/Caregiver | Linked child records, assigned family sessions, result submission | No audit access, staff management, assignment creation, or unrelated child/assignment access |

## Implemented Controls

- Server-side role middleware for admin, therapist, and parent/caregiver roles.
- Clinic-scoped backend queries.
- Parent child-list and assignment-list scoping through `family_child_links`.
- Parent result submission limited to linked/assigned assignments.
- Assignment creation verifies child and assigned caregiver scope.
- Audit route restricted to admin and therapist roles.
- Regression tests for these controls in `server/server.test.ts`.

## Operational Access Review

Review before pilot launch and at least monthly during pilot operation:

- Active admin users.
- Active therapist users.
- Active parent/caregiver users.
- Family-child links.
- Recently created or reset credentials.
- Database users and privileges.
- Hosting/deployment users.
- Secret management access.
- Backup storage access.

## Least-Privilege Database Guidance

- Use a migration/admin database role only for migrations.
- Use an application database role for runtime API access.
- Restrict direct production database access to approved operations staff.
- Require encrypted connections in production.
- Keep backup and restore privileges limited to operations staff.

## Access Review Log

| Date | Reviewer | Scope | Findings | Remediation | Approval |
| --- | --- | --- | --- | --- | --- |
| Pending | Pending | Pending | Pending | Pending | Pending |

## Revocation Procedure

1. Disable or delete application account.
2. Remove family-child links where applicable.
3. Revoke deployment, database, backup, and secret-management access.
4. Rotate credentials if shared exposure is suspected.
5. Record revocation in the access review log.

## Approval

This procedure is ready for operational approval before pilot launch.

