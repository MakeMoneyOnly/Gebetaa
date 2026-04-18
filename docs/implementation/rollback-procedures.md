# Rollback Procedures

This document describes the rollback procedures for lole's Vercel deployments.

## Overview

lole supports multiple rollback mechanisms:

1. **GitHub Actions Workflow** - Automated rollback via GitHub UI or API
2. **Local Script** - Command-line rollback using Vercel CLI

## Prerequisites

### Required Secrets

Ensure the following secrets are configured in your GitHub repository:

| Secret              | Description                  |
| ------------------- | ---------------------------- |
| `VERCEL_TOKEN`      | Vercel personal access token |
| `VERCEL_ORG_ID`     | Vercel organization ID       |
| `VERCEL_PROJECT_ID` | Vercel project ID            |

### Local Setup

For local rollbacks, install Vercel CLI:

```bash
npm i -g vercel
```

Then authenticate:

```bash
vercel login
```

---

## Method 1: GitHub Actions Rollback

### Manual Rollback via GitHub UI

1. Navigate to the repository on GitHub
2. Go to **Actions** → **Rollback**
3. Click **Run workflow**
4. Configure the rollback parameters:
    - **Environment**: `production` or `staging`
    - **Rollback type**:
        - `previous` - Rollback to the previous deployment
        - `deployment_id` - Rollback to a specific deployment ID
        - `versions_back` - Rollback N versions back
    - **Deployment ID**: Required for `deployment_id` type
    - **Versions back**: Number of versions to rollback (for `versions_back` type)
    - **Reason**: Description of why the rollback is needed
5. Click **Run workflow**

### Automated Rollback via API

You can trigger a rollback using the GitHub API:

```bash
# Rollback to previous deployment
gh api -X POST /repos/{owner}/{repo}/actions/workflows/rollback.yml/dispatches \
  -f ref=main \
  -f inputs='{"environment":"production","rollback_type":"previous","reason":"Critical bug fix"}'

# Rollback to specific deployment
gh api -X POST /repos/{owner}/{repo}/actions/workflows/rollback.yml/dispatches \
  -f ref=main \
  -f inputs='{"environment":"production","rollback_type":"deployment_id","deployment_id":"dpl_xxxxx","reason":"Known good version"}'
```

### Rollback Workflow Features

The rollback workflow:

- Fetches the current deployment list
- Determines the target deployment based on rollback type
- Performs the rollback using Vercel CLI
- Verifies the rollback was initiated
- Provides summary information

---

## Method 2: Local Rollback Script

### Bash Script (Linux/macOS/Git Bash)

```bash
# Make the script executable
chmod +x scripts/rollback.sh

# Rollback to previous deployment (production)
./scripts/rollback.sh

# Rollback staging to previous
./scripts/rollback.sh --environment staging

# Rollback to specific deployment ID
./scripts/rollback.sh --type deployment_id --deployment dpl_xxxxx

# Rollback 2 versions back
./scripts/rollback.sh --type versions_back --versions 2

# Rollback with custom reason (skip confirmation)
./scripts/rollback.sh --reason "Fixing payment bug" --yes
```

### PowerShell Script (Windows)

```powershell
# Rollback to previous deployment (production)
.\scripts\tools\rollback.ps1

# Rollback staging to previous
.\scripts\tools\rollback.ps1 -Environment staging

# Rollback to specific deployment ID
.\scripts\tools\rollback.ps1 -Type deployment_id -DeploymentId dpl_xxxxx

# Rollback 2 versions back
.\scripts\tools\rollback.ps1 -Type versions_back -VersionsBack 2

# Rollback with custom reason (skip confirmation)
.\scripts\tools\rollback.ps1 -Reason "Fixing payment bug" -SkipConfirm
```

### Script Options

| Option          | Alias | Description        | Default                   |
| --------------- | ----- | ------------------ | ------------------------- |
| `--environment` | `-e`  | Target environment | `production`              |
| `--type`        | `-t`  | Rollback type      | `previous`                |
| `--deployment`  | `-d`  | Deployment ID      | -                         |
| `--versions`    | `-v`  | Versions back      | `1`                       |
| `--reason`      | `-r`  | Rollback reason    | `Manual rollback via CLI` |
| `--yes`         | `-y`  | Skip confirmation  | `false`                   |
| `--help`        | `-h`  | Show help          | -                         |

---

## Rollback Types Explained

### Previous Deployment

Rolls back to the most recent deployment before the current one.

```bash
# GitHub Actions
rollback_type: previous

# Local script (default)
./scripts/rollback.sh
```

### Specific Deployment ID

Rolls back to a specific deployment by ID. Useful when you know exactly which deployment was working.

```bash
# GitHub Actions
rollback_type: deployment_id
deployment_id: dpl_xxxxx

# Local script
./scripts/rollback.sh --type deployment_id --deployment dpl_xxxxx
```

### Versions Back

Rolls back a specific number of versions from the current deployment.

```bash
# GitHub Actions
rollback_type: versions_back
versions_back: 2

# Local script
./scripts/rollback.sh --type versions_back --versions 2
```

---

## Finding Deployment IDs

### Via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click on the **Deployments** tab
4. Copy the deployment ID from the URL or deployment list

### Via Vercel CLI

```bash
# List recent deployments
vercel list

# List with more details
vercel ls --prod
```

### Via GitHub Actions

The rollback workflow automatically fetches and displays the deployment list before performing the rollback.

---

## Best Practices

### When to Rollback

Consider rollback when:

- **Critical bugs** affect production functionality
- **Performance degradation** is observed
- **Security vulnerabilities** are discovered
- **Deployment causes** significant error rate increase

### Before Rolling Back

1. **Document the issue**: Note what went wrong and when it started
2. **Notify stakeholders**: Inform the team about the rollback
3. **Check feature flags**: Consider disabling problematic features first
4. **Review deployment history**: Understand what changed

### After Rolling Back

1. **Verify functionality**: Test critical user flows
2. **Monitor metrics**: Watch for error rates and latency
3. **Document the incident**: Record what happened and next steps
4. **Plan the fix**: Address the root cause before redeploying

---

## Troubleshooting

### "Not authenticated" Error

Ensure you're logged in to Vercel:

```bash
vercel login
vercel whoami
```

### "Deployment not found" Error

Verify the deployment ID is correct:

```bash
vercel list lole
```

### Rollback Stuck

If the rollback appears stuck:

1. Check the Vercel dashboard for deployment status
2. Verify the target deployment exists
3. Try a different rollback type

### Permission Errors

Ensure your Vercel token has the necessary permissions:

- `deployment:read`
- `deployment:write`

---

## Related Documentation

- [Release Cadence](./release-cadence.md)
- [P0 Release Readiness and Rollback](../08-reports/rollout/p0-release-readiness-and-rollback.md)
- [Feature Flags](../03-product/feature-flags.md)
