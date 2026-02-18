# Migration Standards

## Naming

- Format: `YYYYMMDD_short_description.sql`
- Example: `20260217_p0_tables_sessions_foundation.sql`

## Required Structure

Each migration should include:

1. Header comment with date and purpose.
2. `BEGIN; ... COMMIT;` transaction block.
3. Idempotent DDL (`IF NOT EXISTS` / guarded changes).
4. Explicit indexes for query-critical paths.
5. RLS policy updates for any new table.

## Safety Rules

- Do not drop data in production migrations without explicit approval.
- Never use `USING (true)` style permissive policies for protected data.
- Ensure every write path has corresponding rollback guidance.
- Prefer additive schema changes before destructive changes.

## Verification Checklist

- Migration applies on clean DB.
- Migration applies on existing DB.
- No lock-heavy operations during peak windows.
- App code is backward compatible during rollout.

## Rollback Expectations

- Document rollback SQL or mitigation steps in PR description.
- If rollback is not feasible, document compensating actions.

## Post-Migration

- Update typed schema artifacts as needed.
- Add/adjust tests.
- Update `CHANGELOG.md` and relevant docs.
