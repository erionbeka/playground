# Data Retention, Deletion, and Export Policy

This policy defines how Playground Life data should be retained, deleted, de-identified, and exported during pilot and production use.

## Data Categories

- Account data: names, email/phone, role, credential status, password hash, sign-in timestamp.
- Child profile data: name/display name, birth date, diagnosis field, notes, support needs, personalization profile, skill profile, and progression settings.
- Therapy workflow data: goals, assignments, difficulty, support level, due dates, approval status, and monthly plan metadata.
- Outcome data: completion, score, duration, interactions, metrics, and skill scores.
- Audit data: actor, action, entity, timestamp, IP address, user agent, and structured details.

## Retention Policy

- Pilot retention period must be defined in consent materials before enrollment.
- Production retention must follow clinic policy, legal requirements, and signed data-processing agreements.
- Audit logs should be retained long enough to support security review and incident response but should avoid unnecessary clinical detail.
- Backup retention must align with the approved backup policy and deletion obligations.

## Deletion Procedure

1. Verify requester identity and authority.
2. Identify account, child, assignment, result, audit, and family-link records in scope.
3. Confirm whether legal, clinical, audit, or contractual retention prevents full deletion.
4. Delete or de-identify eligible records.
5. Record deletion request date, approver, scope, action taken, and completion date.
6. Confirm whether backups will age out naturally or require targeted handling according to hosting capabilities and policy.

## Export Procedure

1. Verify requester identity and authority.
2. Confirm export scope: account, child profile, goals, assignments, results, audit history, or all records.
3. Export only the approved records.
4. Transfer through an approved secure channel.
5. Record export date, recipient, data scope, delivery method, and approver.

## De-Identification Guidance

For pilot publication or reporting, remove direct identifiers and minimize quasi-identifiers:

- Remove child names, caregiver names, phone numbers, emails, and account IDs.
- Replace child IDs with study IDs.
- Aggregate small-cell results where re-identification risk exists.
- Remove free-text notes unless reviewed for identifying details.
- Report feasibility/usability findings without unnecessary clinical detail.

## Request Log

| Date | Request Type | Requester | Scope | Decision | Completed By | Completion Date |
| --- | --- | --- | --- | --- | --- | --- |
| Pending | Pending | Pending | Pending | Pending | Pending | Pending |

## Approval

This policy is ready for privacy/legal/clinic approval before pilot enrollment.

