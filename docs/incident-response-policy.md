# Incident Response Policy

This policy defines how Playground Life incidents are identified, triaged, contained, communicated, remediated, and reviewed.

## Scope

Applies to security, privacy, availability, data integrity, unauthorized access, misconfiguration, backup/restore, and pilot safety incidents.

## Incident Roles

- Incident Commander: coordinates response and timeline.
- Technical Lead: investigates application, database, deployment, and logs.
- Privacy/Security Lead: determines data protection impact and notification path.
- Clinic/Pilot Owner: coordinates participant, caregiver, therapist, and clinic communications.
- Communications Owner: prepares approved stakeholder updates.

## Severity Levels

| Severity | Definition | Examples | Target Initial Response |
| --- | --- | --- | --- |
| Critical | Confirmed or likely unauthorized access to PHI/PII, major outage, destructive data loss | Exposed child data, compromised admin account, production database loss | 1 hour |
| High | Serious vulnerability or limited data exposure risk | Broken authorization, leaked token, failed restore during active pilot | 4 hours |
| Medium | User-impacting defect or privacy process failure without confirmed exposure | Incorrect assignment visibility, missing audit event | 1 business day |
| Low | Minor operational issue | Documentation gap, non-sensitive configuration drift | 5 business days |

## Response Steps

1. Identify and log the incident.
2. Assign severity and incident roles.
3. Preserve evidence: logs, timestamps, affected accounts, deployment version, and database state.
4. Contain the issue: disable affected accounts, rotate secrets, stop writes, rollback release, or restrict access as needed.
5. Assess data impact and legal/privacy notification obligations.
6. Remediate and verify with tests or reviewer confirmation.
7. Communicate approved updates to affected stakeholders.
8. Complete a post-incident review within 10 business days.
9. Track follow-up actions to closure.

## Required Incident Record

- Incident ID.
- Date/time detected.
- Reporter.
- Severity.
- Affected systems/data.
- Affected users/clinics, if known.
- Timeline.
- Containment actions.
- Root cause.
- Remediation evidence.
- Notification decision.
- Final reviewer approval.

## Incident Log

| ID | Date | Severity | Summary | Owner | Status | Closure Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| Pending | Pending | Pending | Pending | Pending | Pending | Pending |

## Approval

This policy is ready for approval by the deployment owner, privacy/security owner, and pilot owner before live pilot operation.

