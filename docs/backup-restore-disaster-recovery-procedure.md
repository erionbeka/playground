# Backup, Restore, and Disaster Recovery Procedure

This procedure defines how Playground Life production data should be backed up, restore-tested, and recovered after an outage or data-loss event.

## Scope

Applies to production and pilot PostgreSQL databases that store clinic, user, child, assignment, result, and audit data.

## Implemented Tooling

Package scripts:

- `npm run db:backup`: creates a timestamped custom-format PostgreSQL backup with `pg_dump`.
- `npm run db:restore:test`: restores a backup into a separate restore-test database with `pg_restore` and verifies required tables exist.
- `npm run db:drill`: runs backup and restore-test together.

Required environment variables:

- `DATABASE_URL`: source database to back up.
- `RESTORE_TEST_DATABASE_URL`: separate test/staging database used only for restore drills.
- `BACKUP_DIR`: optional backup output directory. Defaults to `./backups`.
- `BACKUP_FILE`: optional explicit backup file path.

Safety guard: restore tests only run when `RESTORE_TEST_DATABASE_URL` points to a database name containing `test`, `restore`, `drill`, or `staging`.

## Backup Policy

- Production backups must run at least daily during pilot operation.
- Backup storage must be encrypted at rest.
- Backup transfer must use encrypted transport.
- Backup access must be limited to authorized operations staff.
- Backup files must not be committed to source control.
- Retention must follow the approved retention policy in `docs/data-retention-deletion-export-policy.md`.

## Restore Test Procedure

1. Provision or reset a restore-test database with no real participant use.
2. Set `DATABASE_URL` to the source database.
3. Set `RESTORE_TEST_DATABASE_URL` to the restore-test database.
4. Run `npm run db:drill`.
5. Record the backup file name, restore-test database name, start/end time, outcome, and any remediation in the evidence log below.

## Disaster Recovery Procedure

1. Declare incident severity and assign incident commander.
2. Stop writes if data integrity is at risk.
3. Preserve logs, deployment version, database state, and backup metadata.
4. Identify the recovery point objective and selected backup.
5. Restore into a clean recovery database first.
6. Verify schema, required tables, user counts, child counts, assignment counts, result counts, and audit continuity.
7. Switch application traffic only after owner approval.
8. Notify affected stakeholders according to the incident response policy.
9. Complete post-incident review and update safeguards.

## Recovery Targets

- Recovery Point Objective: to be approved before pilot launch.
- Recovery Time Objective: to be approved before pilot launch.
- Minimum restore-drill cadence: before pilot launch, after major database changes, and at least quarterly during production operation.

## Evidence Log

| Date | Version/Commit | Source DB | Restore DB | Backup File | Result | Reviewer | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending |

## Approval

This procedure is ready for operational approval. It is not approved until the deployment owner and privacy/security owner sign the evidence register or equivalent governance record.

