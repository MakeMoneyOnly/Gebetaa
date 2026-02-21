# Gebeta Codebase Cleanup Audit Report

**Date:** 2026-02-21  
**Auditor:** Cline AI  
**Purpose:** Identify temporary, unused, and outdated files for house cleaning

---

## 🔴 CRITICAL - Security Issues (Delete Immediately)

### Files with Hardcoded Credentials

| File                        | Issue                                        | Action     |
| --------------------------- | -------------------------------------------- | ---------- |
| `scripts/check-realtime.js` | Contains hardcoded Supabase service role key | **DELETE** |
| `scripts/check-realtime.ts` | Contains hardcoded Supabase service role key | **DELETE** |

**Risk:** These files expose production database credentials. Even if the database is rotated, this is a security anti-pattern.

---

## 🟠 HIGH PRIORITY - Temporary Files (Should Not Be Committed)

### Build/Lint Output Files

| File                    | Description                          | Action                             |
| ----------------------- | ------------------------------------ | ---------------------------------- |
| `git_log.txt`           | Temporary git log output             | **DELETE**                         |
| `lint_output.txt`       | Temporary lint output                | **DELETE**                         |
| `tsc_output.txt`        | Temporary TypeScript compiler output | **DELETE**                         |
| `type_check_output.txt` | Temporary type check output          | **DELETE**                         |
| `.tmp_finance_dev_pid`  | Temporary PID file                   | **DELETE**                         |
| `tsconfig.tsbuildinfo`  | TypeScript build cache               | **DELETE** (add to .gitignore)     |
| `next-env.d.ts`         | Next.js type definitions             | **DELETE** (already in .gitignore) |

**Note:** These files should be in `.gitignore`. The `.gitignore` already has `*.txt` but these files may have been committed before the rule was added.

---

## 🟡 MEDIUM PRIORITY - Duplicate Files

### JavaScript/TypeScript Duplicates

| Files                                                     | Recommendation                       |
| --------------------------------------------------------- | ------------------------------------ |
| `fix-slugs.js` + `fix-slugs.ts`                           | **DELETE `.js` version**, keep `.ts` |
| `scripts/check-realtime.js` + `scripts/check-realtime.ts` | **DELETE BOTH** (security issue)     |

**Rationale:** TypeScript versions are the source of truth. Compiled `.js` files should not be committed.

---

## 🟡 MEDIUM PRIORITY - Unused Default Assets

### Next.js Boilerplate Files (Not Used in Codebase)

| File                | Description           | Action     |
| ------------------- | --------------------- | ---------- |
| `public/vercel.svg` | Default Vercel logo   | **DELETE** |
| `public/next.svg`   | Default Next.js logo  | **DELETE** |
| `public/globe.svg`  | Default Next.js asset | **DELETE** |
| `public/window.svg` | Default Next.js asset | **DELETE** |
| `public/file.svg`   | Default Next.js asset | **DELETE** |

**Verification:** Searched codebase - no references found to these files.

---

## 🔵 LOW PRIORITY - Potentially Outdated Documentation

### Planning/Remediation Documents

| File                                | Description                              | Recommendation                        |
| ----------------------------------- | ---------------------------------------- | ------------------------------------- |
| `REMEDIATION_PROMPT.md`             | One-time AI prompt for audit remediation | **DELETE** after remediation complete |
| `STAFF_MANAGEMENT_REFACTOR_PLAN.md` | Planning document for staff refactor     | **DELETE** if refactor is complete    |

**Note:** Review with team before deleting. These may still be useful for reference.

---

## 🔵 LOW PRIORITY - SKILLS Directory

### AI Skills Collection

The `SKILLS/` directory contains 100+ AI skill files for development patterns.

**Current Status:**

- `.gitignore` has `SKILLS/*` with `!SKILLS/enterprise/` exception
- Directory is still being tracked (may have been committed before gitignore rule)

**Recommendation:**

1. If skills are used by the team: Keep and remove from gitignore
2. If skills are not used: **DELETE entire directory** to reduce repo size
3. Consider moving to a separate repository if needed for reference

---

## 🔵 LOW PRIORITY - Test Files

### Example Test File

| File                  | Description            | Action                                |
| --------------------- | ---------------------- | ------------------------------------- |
| `e2e/example.spec.ts` | Basic example E2E test | **KEEP** (provides basic smoke tests) |

**Note:** This file provides value as a basic smoke test for auth flows.

---

## 📋 Summary

### Files to Delete (13 files)

```bash
# CRITICAL - Security Issues
scripts/check-realtime.js
scripts/check-realtime.ts

# HIGH - Temporary Files
git_log.txt
lint_output.txt
tsc_output.txt
type_check_output.txt
.tmp_finance_dev_pid
tsconfig.tsbuildinfo
next-env.d.ts

# MEDIUM - Duplicates
fix-slugs.js

# MEDIUM - Unused Assets
public/vercel.svg
public/next.svg
public/globe.svg
public/window.svg
public/file.svg
```

### Files to Review Before Deleting (2 files)

```bash
REMEDIATION_PROMPT.md
STAFF_MANAGEMENT_REFACTOR_PLAN.md
```

### Directories to Review

```bash
SKILLS/  # 100+ AI skill files - evaluate if needed
```

---

## 🛠️ Recommended Actions

### 1. Update .gitignore

Add these entries to ensure files aren't re-committed:

```gitignore
# TypeScript build cache
*.tsbuildinfo

# Temporary output files
*_output.txt
git_log.txt
.tmp_*
```

### 2. Delete Files Command

```bash
# Run from project root
rm -f scripts/check-realtime.js scripts/check-realtime.ts
rm -f git_log.txt lint_output.txt tsc_output.txt type_check_output.txt
rm -f .tmp_finance_dev_pid tsconfig.tsbuildinfo next-env.d.ts
rm -f fix-slugs.js
rm -f public/vercel.svg public/next.svg public/globe.svg public/window.svg public/file.svg
```

### 3. Remove from Git History (if sensitive data was committed)

```bash
# If check-realtime files were committed with credentials, rotate credentials immediately
# Then use BFG or git-filter-repo to remove from history
```

---

## ✅ Cleanup Checklist

- [x] Delete files with hardcoded credentials (CRITICAL)
- [x] Delete temporary output files
- [x] Delete duplicate .js files
- [x] Delete unused Next.js boilerplate assets
- [x] Update .gitignore with additional patterns
- [ ] Review and delete outdated planning documents
- [ ] Evaluate SKILLS directory necessity
- [ ] **ROTATE SUPABASE SERVICE ROLE KEY** (KEY WAS COMMITTED TO GIT!)
- [ ] Commit cleanup changes

---

## ⚠️ ACTION REQUIRED: Rotate Supabase Service Role Key

**The files `scripts/check-realtime.js` and `scripts/check-realtime.ts` were found in git history.**

This means your Supabase service role key was committed to the repository.

### Steps to Rotate the Key:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to: Project Settings → API → Service Role Key
3. Click "Reset" or "Regenerate" to create a new key
4. Update your `.env.local` and all deployment environments with the new key
5. Consider using [git-filter-repo](https://github.com/newren/git-filter-repo) or BFG Repo-Cleaner to remove the sensitive data from git history

**Important:** Anyone with access to your git repository (including if it's public) could have seen this key.

---

## Cleanup Completed: 2026-02-21

The following files were successfully deleted:
- `scripts/check-realtime.js` (contained hardcoded credentials)
- `scripts/check-realtime.ts` (contained hardcoded credentials)
- `git_log.txt`
- `lint_output.txt`
- `tsc_output.txt`
- `type_check_output.txt`
- `.tmp_finance_dev_pid`
- `tsconfig.tsbuildinfo`
- `next-env.d.ts`
- `fix-slugs.js`
- `public/vercel.svg`
- `public/next.svg`
- `public/globe.svg`
- `public/window.svg`
- `public/file.svg`

The `.gitignore` was updated with additional patterns.

---

**Estimated Space Recovery:** ~50-100KB (more if SKILLS directory removed)  
**Security Risk Mitigation:** High (removes exposed credentials)  
**Codebase Cleanliness:** Improved (removes 15+ unnecessary files)
