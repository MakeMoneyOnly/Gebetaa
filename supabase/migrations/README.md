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
- **Always include `ON DELETE CASCADE` or `ON DELETE SET NULL` for foreign keys referencing `auth.users`**. Failing to do so will cause "Database error deleting user" when trying to delete users from the Supabase Dashboard. See [Supabase Troubleshooting Guide](https://supabase.com/docs/guides/troubleshooting/dashboard-errors-when-managing-users-N1ls4A).

## Auth.Users Foreign Key Guidelines

When creating foreign keys to `auth.users`, choose the appropriate `ON DELETE` action:

| Action                  | Use Case                                           | Example                                                  |
| ----------------------- | -------------------------------------------------- | -------------------------------------------------------- |
| `ON DELETE CASCADE`     | Child records should be deleted with the user      | `restaurant_staff` (user's staff membership)             |
| `ON DELETE SET NULL`    | Preserve audit trail, allow NULL when user deleted | `staff_invites.created_by`, `order_events.actor_user_id` |
| `ON DELETE SET DEFAULT` | Set to default value when user deleted             | Rarely needed                                            |

**Example:**

```sql
-- Correct: Allows user deletion while preserving audit trail
created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL

-- Incorrect: Will block user deletion with FK constraint error
created_by UUID REFERENCES auth.users(id)
```

To verify all auth.users FKs have proper cascade rules:

```sql
SELECT * FROM public.check_auth_users_fk_cascade();
```

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
