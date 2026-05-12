# Penetration Test Plan and Evidence Log

This document defines the penetration-test scope for Playground Life. It is a test plan and evidence log, not a substitute for an independently executed penetration test.

## Scope

In scope:

- React frontend authentication and role-specific workflows.
- Node/Express API routes under `/api/auth`, `/api/children`, `/api/assignments`, and `/api/audit`.
- PostgreSQL-backed data flows for users, children, assignments, game results, and audit logs.
- Session handling, CORS behavior, security headers, request validation, and role-based authorization.

Out of scope until deployment is selected:

- Hosting provider infrastructure.
- DNS, CDN, WAF, managed database configuration, backups, and cloud IAM.
- Email/SMS invite delivery providers.
- Employee endpoint devices.

## Test Environment Requirements

- Staging deployment using production-like environment variables.
- Fresh staging Postgres database seeded with synthetic test data only.
- TLS enabled.
- `COOKIE_SECURE=true` when served over HTTPS.
- Test accounts for admin, therapist, parent/caregiver, and second-clinic isolation checks.
- Known application version or commit hash recorded before testing.

## Required Test Cases

| Category | Test |
| --- | --- |
| Authentication | Invalid login, inactive credential status, weak payload validation, session expiry, cookie flags |
| Authorization | Parent blocked from staff/assignment/audit management, therapist blocked from admin-only actions, unauthenticated requests rejected |
| Object access | Users cannot access child, assignment, result, or audit records outside their clinic or family link |
| Input validation | Invalid UUIDs, invalid enum values, oversized payloads, malformed JSON, unexpected object fields |
| Injection | SQL injection attempts against identifiers, login fields, IDs, notes, metrics, and JSON fields |
| Session security | Token tampering, missing token, expired token, cookie/header precedence |
| Browser security | Security headers, XSS attempts in notes/profile fields, report generation output handling |
| Rate limiting | Login and API request throttling behavior under repeated requests |
| Auditability | Key events produce audit records without storing unnecessary sensitive detail |
| Data export/reporting | Generated reports do not expose unauthorized child/caregiver data |

## Evidence Log Template

| Date | Tester | Version/Commit | Environment | Finding | Severity | Status | Retest Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |

## Current Internal Security Regression Coverage

The automated API test suite currently checks:

- Valid login and audit creation.
- Invalid credential rejection.
- HTTP-only and SameSite session cookie attributes.
- Baseline Helmet security headers.
- Authentication requirement for session lookup.
- Admin-only staff creation.
- Clinic-scoped child creation.
- Invalid child payload rejection before database write.
- Parent assignment-creation restriction.
- Parent child-list and assignment-list scoping to linked/assigned records.
- Assignment creation blocked when the child or assigned caregiver is outside the caller clinic/family scope.
- Game result recording and assignment status update.
- Parent result recording blocked for unlinked assignments.
- Parent audit-log restriction.
- Clinic-scoped audit-log query behavior.

## Completion Criteria

The penetration test can be marked complete only after an independent tester executes the plan against a staging or production-equivalent environment, files findings, confirms remediation evidence, and records a final pilot go/no-go decision.
