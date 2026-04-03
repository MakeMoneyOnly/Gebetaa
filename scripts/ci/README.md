# CI Scripts

This directory contains CI/CD validation scripts for the Gebeta project.

## Scripts

### `check-migration-conflicts.ts`

Detects duplicate timestamp prefixes in Supabase migration files.

**Usage:**

```bash
pnpm ci:migration-check
```

**Purpose:**
Supabase migrations are executed in lexicographic order based on filename. If two migrations share the same timestamp prefix (e.g., `20260324000000_feature_a.sql` and `20260324000000_feature_b.sql`), the execution order is undefined and may cause deployment failures or inconsistent database states.

**Exit Codes:**

- `0` - No conflicts detected
- `1` - Timestamp conflicts found

**Remediation:**
If conflicts are detected, rename migration files to have unique timestamps:

```bash
# Before
20260324000000_feature_a.sql
20260324000000_feature_b.sql

# After
20260324000000_feature_a.sql
20260324000001_feature_b.sql
```

**Reference:** `PRE-PRODUCTION-REMEDIATION-TASKS.md` HIGH-004

## Adding New CI Scripts

When adding new CI validation scripts:

1. Place the script in this directory (`scripts/ci/`)
2. Use `tsx` as the runtime for TypeScript files
3. Follow the exit code convention:
    - `0` for success
    - Non-zero for failures
4. Add a corresponding script entry in `package.json` with the `ci:` prefix
5. Document the script in this README
