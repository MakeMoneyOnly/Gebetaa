# Database Backup and Restore Procedures

Last updated: 2026-04-04

This document outlines the backup and restore procedures for the lole Restaurant OS database, including RPO/RTO targets, verification procedures, and disaster recovery runbooks.

## Overview

lole Restaurant OS uses Supabase (PostgreSQL) as its primary database. Supabase provides automatic backup capabilities, and we also maintain manual backup procedures for additional safety and compliance.

### Database Architecture

| Component        | Description                            |
| ---------------- | -------------------------------------- |
| Primary Database | Supabase PostgreSQL (managed)          |
| Backup Storage   | Supabase-managed + S3 (manual backups) |
| Retention        | 30 days (Pro plan)                     |
| PITR             | Enabled (Pro plan)                     |

---

## Recovery Objectives

### Recovery Point Objective (RPO)

| Scenario           | Target              | Maximum Acceptable |
| ------------------ | ------------------- | ------------------ |
| With PITR          | 1 hour              | 2 hours            |
| Daily backups only | 24 hours            | 48 hours           |
| Manual backup      | Time of last backup | 24 hours           |

### Recovery Time Objective (RTO)

| Scenario              | Target     | Maximum Acceptable |
| --------------------- | ---------- | ------------------ |
| Single table restore  | 15 minutes | 30 minutes         |
| Full database restore | 1 hour     | 4 hours            |
| Cross-region failover | 2 hours    | 8 hours            |

---

## Automated Backups

### Supabase Managed Backups

Supabase provides automatic daily backups for all projects:

| Plan | Backup Retention | Point-in-Time Recovery (PITR) |
| ---- | ---------------- | ----------------------------- |
| Free | 7 days           | No                            |
| Pro  | 30 days          | Yes                           |
| Team | 30 days          | Yes                           |

### Backup Schedule

| Backup Type   | Frequency           | Retention | Location         |
| ------------- | ------------------- | --------- | ---------------- |
| Full snapshot | Daily (2:00 AM UTC) | 30 days   | Supabase-managed |
| WAL archives  | Continuous          | 7 days    | Supabase-managed |
| Manual dumps  | On-demand           | 90 days   | S3 bucket        |

### Accessing Backups

1. Navigate to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Project Settings** > **Database** > **Backups**
4. View available backup snapshots with timestamps

### Backup Contents

The following data is included in backups:

| Data Type              | Included | Notes                                 |
| ---------------------- | -------- | ------------------------------------- |
| Application tables     | ✅       | All tables in `public` schema         |
| Auth users             | ✅       | `auth.users` and related tables       |
| Storage objects        | ✅       | File storage buckets                  |
| Edge functions         | ❌       | Must be redeployed from code          |
| Realtime subscriptions | ❌       | Transient, not backed up              |
| Environment variables  | ❌       | Must be restored from secrets manager |

---

## Manual Backup Procedures

### Using pg_dump

```bash
# Full database backup with roles and privileges
pg_dump $DATABASE_DIRECT_URL --no-owner --no-privileges > backup_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup (recommended)
pg_dump $DATABASE_DIRECT_URL --format=custom --file=backup_$(date +%Y%m%d).dump

# Schema-only backup (for migration testing)
pg_dump $DATABASE_DIRECT_URL --schema-only > schema_backup.sql

# Data-only backup (for data refresh)
pg_dump $DATABASE_DIRECT_URL --data-only --inserts > data_backup.sql

# Specific tables backup
pg_dump $DATABASE_DIRECT_URL --table=orders --table=order_items > orders_backup.sql

# Backup with row limits (for large tables)
pg_dump $DATABASE_DIRECT_URL --table=audit_logs --exclude-table-data=audit_logs > schema_with_limited_data.sql
```

### Using Supabase CLI

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Create a backup (full dump)
supabase db dump -f backup_$(date +%Y%m%d).sql

# Create a backup (custom format, recommended)
supabase db dump -f backup_$(date +%Y%m%d).dump --format=custom

# Backup specific schema
supabase db dump -f public_backup.sql --schema=public

# Backup with data only
supabase db dump -f data_only.sql --data-only
```

### Production Backup Script

Create a backup script at `scripts/database/backup-production.sh`:

```bash
#!/bin/bash
# Production Database Backup Script
# Usage: ./backup-production.sh [environment]

set -euo pipefail

# Configuration
ENVIRONMENT="${1:-production}"
BACKUP_DIR="./backups/${ENVIRONMENT}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/lole_${ENVIRONMENT}_${TIMESTAMP}.dump"
METADATA_FILE="${BACKUP_DIR}/lole_${ENVIRONMENT}_${TIMESTAMP}.meta.json"
S3_BUCKET="s3://lole-backups/${ENVIRONMENT}"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Load environment variables
if [ -f ".env.${ENVIRONMENT}" ]; then
    source ".env.${ENVIRONMENT}"
fi

# Validate DATABASE_DIRECT_URL is set
if [ -z "${DATABASE_DIRECT_URL:-}" ]; then
    echo "ERROR: DATABASE_DIRECT_URL is not set"
    exit 1
fi

echo "=== Starting backup for ${ENVIRONMENT} ==="
echo "Timestamp: ${TIMESTAMP}"

# Create backup
echo "Creating database backup..."
pg_dump "$DATABASE_DIRECT_URL" --format=custom --file="$BACKUP_FILE"

# Verify backup was created
if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file was not created"
    exit 1
fi

# Get backup size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "Backup size: ${BACKUP_SIZE}"

# Create metadata file
cat > "$METADATA_FILE" <<EOF
{
    "environment": "${ENVIRONMENT}",
    "timestamp": "${TIMESTAMP}",
    "file": "$(basename "$BACKUP_FILE")",
    "size_bytes": $(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE"),
    "database_url_host": "$(echo "$DATABASE_DIRECT_URL" | sed -E 's|.*@([^/:]+).*|\1|')",
    "created_by": "$(whoami)",
    "created_at": "$(date -Iseconds)"
}
EOF

# Verify backup integrity
echo "Verifying backup integrity..."
pg_restore --list "$BACKUP_FILE" > /dev/null
if [ $? -eq 0 ]; then
    echo "✓ Backup integrity verified"
else
    echo "ERROR: Backup integrity check failed"
    exit 1
fi

# Upload to S3 (if configured)
if command -v aws &> /dev/null; then
    echo "Uploading to S3..."
    aws s3 cp "$BACKUP_FILE" "${S3_BUCKET}/$(basename "$BACKUP_FILE")"
    aws s3 cp "$METADATA_FILE" "${S3_BUCKET}/$(basename "$METADATA_FILE")"
    echo "✓ Uploaded to S3"
fi

# Clean up old backups (keep last 30 days)
echo "Cleaning up old backups..."
find "$BACKUP_DIR" -name "*.dump" -mtime +30 -delete
find "$BACKUP_DIR" -name "*.meta.json" -mtime +30 -delete

echo "=== Backup completed successfully ==="
echo "File: ${BACKUP_FILE}"
echo "Size: ${BACKUP_SIZE}"
```

### Scheduled Backup Cron

Add to crontab for automated daily backups:

```bash
# Edit crontab
crontab -e

# Add daily backup at 3:00 AM UTC (after Supabase's backup)
0 3 * * * /path/to/lole/scripts/database/backup-production.sh production >> /var/log/lole-backup.log 2>&1
```

---

## Restore Procedures

### Pre-Restore Checklist

Before restoring, verify:

- [ ] Restore scope identified (full database vs. specific tables)
- [ ] Target environment confirmed (production, staging, etc.)
- [ ] Backup file location and timestamp verified
- [ ] Stakeholders notified of potential downtime
- [ ] Application services that may conflict are stopped
- [ ] Current database state backed up (if accessible)

### Using psql (SQL format)

```bash
# Restore from SQL backup file
psql $DATABASE_DIRECT_URL < backup_20260404.sql

# Restore compressed SQL backup
gunzip -c backup_20260404.sql.gz | psql $DATABASE_DIRECT_URL

# Restore with verbose output
psql $DATABASE_DIRECT_URL -f backup_20260404.sql --echo-all

# Restore specific tables only
psql $DATABASE_DIRECT_URL -f orders_backup.sql
```

### Using pg_restore (Custom format)

```bash
# Restore from custom format backup
pg_restore --dbname=$DATABASE_DIRECT_URL backup_20260404.dump

# Restore with clean (drop existing objects)
pg_restore --clean --dbname=$DATABASE_DIRECT_URL backup_20260404.dump

# Restore specific tables
pg_restore --dbname=$DATABASE_DIRECT_URL --table=orders --table=order_items backup_20260404.dump

# Restore schema only (no data)
pg_restore --dbname=$DATABASE_DIRECT_URL --schema-only backup_20260404.dump

# Restore with verbose output
pg_restore --dbname=$DATABASE_DIRECT_URL --verbose backup_20260404.dump

# Restore to a different database
pg_restore --dbname=lole_restored backup_20260404.dump
```

### Using Supabase Dashboard

1. Navigate to **Project Settings** > **Database** > **Backups**
2. Select the backup to restore from
3. Click **"Restore"** and confirm the action
4. Wait for the restoration to complete (typically 5-30 minutes)
5. Verify the restoration by checking critical tables

### Point-in-Time Recovery (PITR)

For Pro and Team plans, you can restore to any point in time within the WAL retention period:

```bash
# Using Supabase CLI
supabase db restore --timestamp "2026-04-04 10:30:00"

# Using psql (connect to recovery instance)
psql "postgres://postgres:[password]@[recovery-instance].supabase.co:5432/postgres" \
  -c "SELECT pg_restore_point('before_restore');"
```

### Cross-Environment Backup Copying

To copy a backup from one environment to another:

```bash
#!/bin/bash
# Copy production backup to staging

# 1. Download production backup
aws s3 cp s3://lole-backups/production/latest.dump ./production_backup.dump

# 2. Restore to staging
export DATABASE_DIRECT_URL=$STAGING_DATABASE_DIRECT_URL
pg_restore --clean --dbname=$DATABASE_DIRECT_URL ./production_backup.dump

# 3. Verify restoration
psql $DATABASE_DIRECT_URL -c "SELECT COUNT(*) FROM restaurants;"

# 4. Clean up
rm ./production_backup.dump
```

---

## Disaster Recovery Runbook

### Incident Severity Levels

| Level | Description        | Response Time | Example           |
| ----- | ------------------ | ------------- | ----------------- |
| Sev1  | Complete data loss | Immediate     | Database deleted  |
| Sev2  | Partial data loss  | < 30 minutes  | Table dropped     |
| Sev3  | Data corruption    | < 1 hour      | Incorrect update  |
| Sev4  | Backup failure     | < 4 hours     | Backup job failed |

### Sev1: Complete Data Loss

**Response Time**: Immediate

**Steps**:

1. **Declare incident** (0-5 minutes)

    ```bash
    # Notify stakeholders
    ./scripts/incident/notify.sh --severity=1 --message="Database unavailable, initiating recovery"

    # Create incident ticket
    ./scripts/incident/create-ticket.sh --title="Database Recovery" --severity=1
    ```

2. **Assess situation** (5-10 minutes)

    ```bash
    # Check database connectivity
    psql $DATABASE_DIRECT_URL -c "SELECT 1;"

    # Check Supabase status page
    curl -s https://status.supabase.com/api/v2/status.json | jq '.status'

    # Review recent changes
    git log --oneline -10
    ```

3. **Initiate restore** (10-30 minutes)

    ```bash
    # Stop application services
    vercel --prod --env DATABASE_URL=""  # Disable app SQL lane if needed

    # Restore from most recent backup
    pg_restore --clean --dbname=$DATABASE_DIRECT_URL s3://lole-backups/production/latest.dump

    # Or use PITR for more recent data
    supabase db restore --timestamp "$(date -d '1 hour ago' '+%Y-%m-%d %H:%M:%S')"
    ```

4. **Verify restoration** (30-45 minutes)

    ```bash
    # Check table counts
    psql $DATABASE_DIRECT_URL -c "
      SELECT
        (SELECT COUNT(*) FROM restaurants) as restaurants,
        (SELECT COUNT(*) FROM orders) as orders,
        (SELECT COUNT(*) FROM menu_items) as menu_items,
        (SELECT COUNT(*) FROM auth.users) as users;
    "

    # Check recent orders
    psql $DATABASE_DIRECT_URL -c "SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;"

    # Verify auth system
    psql $DATABASE_DIRECT_URL -c "SELECT id, email FROM auth.users LIMIT 5;"
    ```

5. **Resume operations** (45-60 minutes)

    ```bash
    # Re-enable application
    vercel --prod --env DATABASE_URL="$DATABASE_URL"

    # Run smoke tests
    ./scripts/test/smoke-test.sh

    # Monitor for issues
    ./scripts/monitoring/watch-metrics.sh --duration=30m
    ```

### Sev2: Partial Data Loss

**Response Time**: < 30 minutes

**Steps**:

1. Identify affected tables
2. Restore specific tables from backup
3. Verify data integrity
4. Resume operations

```bash
# Restore specific table
pg_restore --dbname=$DATABASE_DIRECT_URL --table=orders backup_latest.dump

# Verify row count matches expected
psql $DATABASE_DIRECT_URL -c "SELECT COUNT(*) FROM orders;"
```

### Sev3: Data Corruption

**Response Time**: < 1 hour

**Steps**:

1. Identify corrupted records
2. Use PITR to restore to point before corruption
3. Re-apply any valid transactions after that point
4. Verify data integrity

```bash
# Find corruption timestamp
psql $DATABASE_DIRECT_URL -c "SELECT MIN(created_at) FROM audit_logs WHERE action = 'suspicious_update';"

# Restore to point before corruption
supabase db restore --timestamp "2026-04-04 09:00:00"
```

---

## Backup Verification Procedures

### Manual Verification

Backups should be tested monthly to ensure they can be restored successfully:

```bash
#!/bin/bash
# Monthly backup verification script

BACKUP_FILE=$1
TEST_DB="backup_verify_$(date +%Y%m%d)"

# Create test database
createdb $TEST_DB

# Restore backup to test database
pg_restore --dbname=$TEST_DB $BACKUP_FILE

# Run integrity checks
psql $TEST_DB <<EOF
-- Check table counts
SELECT 'restaurants' as table_name, COUNT(*) as count FROM restaurants
UNION ALL SELECT 'orders', COUNT(*) FROM orders
UNION ALL SELECT 'menu_items', COUNT(*) FROM menu_items
UNION ALL SELECT 'auth.users', COUNT(*) FROM auth.users;

-- Check foreign key integrity
SELECT 'orders.restaurant_id' as fk_check, COUNT(*) as violations
FROM orders o
LEFT JOIN restaurants r ON o.restaurant_id = r.id
WHERE r.id IS NULL;

-- Check for orphaned records
SELECT 'order_items orphaned' as orphan_check, COUNT(*) as count
FROM order_items oi
LEFT JOIN orders o ON oi.order_id = o.id
WHERE o.id IS NULL;
EOF

# Clean up
dropdb $TEST_DB

echo "Backup verification completed"
```

### Automated Verification

Add to CI/CD pipeline:

```yaml
# .github/workflows/backup-verify.yml
name: Verify Backup

on:
    schedule:
        - cron: '0 0 * * 0' # Weekly
    workflow_dispatch:

jobs:
    verify:
        runs-on: ubuntu-latest
        services:
            postgres:
                image: postgres:15
                env:
                    POSTGRES_PASSWORD: postgres
                options: >-
                    --health-cmd pg_isready
                    --health-interval 10s
                    --health-timeout 5s
                    --health-retries 5
        steps:
            - name: Checkout repository
              uses: actions/checkout@v4

            - name: Install PostgreSQL client
              run: |
                  sudo apt-get update
                  sudo apt-get install -y postgresql-client

            - name: Download latest backup
              env:
                  AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
                  AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
              run: |
                  aws s3 cp s3://lole-backups/production/latest.dump ./backup.dump

            - name: Verify backup integrity
              run: |
                  pg_restore --list backup.dump | head -n 20
                  pg_restore --list backup.dump | grep -q "public.orders" || exit 1
                  pg_restore --list backup.dump | grep -q "public.restaurants" || exit 1

            - name: Test restore
              run: |
                  PGPASSWORD=postgres psql -h postgres -U postgres -c "CREATE DATABASE verify_test;"
                  pg_restore --dbname="postgres://postgres:postgres@postgres:5432/verify_test" backup.dump
                  PGPASSWORD=postgres psql -h postgres -U postgres -d verify_test -c "SELECT COUNT(*) FROM restaurants;"

            - name: Notify on failure
              if: failure()
              run: |
                  curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
                    -H 'Content-type: application/json' \
                    -d '{"text":"⚠️ Backup verification failed! Check the GitHub Actions workflow."}'
```

---

## Backup Retention Policy

| Backup Type           | Retention | Storage Location          |
| --------------------- | --------- | ------------------------- |
| Daily snapshots       | 30 days   | Supabase-managed          |
| Weekly archives       | 90 days   | S3 (lole-backups)         |
| Monthly archives      | 1 year    | S3 (lole-backups-archive) |
| Pre-migration backups | 90 days   | S3 (lole-backups)         |

---

## Backup Checklist

### Daily (Automated)

- [ ] Supabase automated backup completed
- [ ] Backup notification received
- [ ] Backup size within expected range

### Weekly

- [ ] Manual backup to S3 completed
- [ ] Backup verification test passed
- [ ] Old backups cleaned up per retention policy

### Monthly

- [ ] Full restore test completed
- [ ] RTO/RPO targets validated
- [ ] Backup documentation reviewed
- [ ] Team training refreshed

### Quarterly

- [ ] Disaster recovery drill completed
- [ ] Backup procedures audited
- [ ] Retention policy reviewed
- [ ] Contact information updated

---

## Contacts

| Role               | Contact              | Escalation                     |
| ------------------ | -------------------- | ------------------------------ |
| Supabase Support   | support@supabase.com | Priority support for Pro plans |
| On-call Engineer   | PagerDuty            | Sev1/Sev2 incidents            |
| Database Team Lead | db-team@lole.app     | Complex restore operations     |
| DevOps Lead        | devops@lole.app      | Infrastructure issues          |

---

## Revision History

| Date       | Author           | Changes                                                               |
| ---------- | ---------------- | --------------------------------------------------------------------- |
| 2026-02-18 | Engineering Team | Initial documentation                                                 |
| 2026-04-04 | Engineering Team | Added RPO/RTO targets, detailed procedures, disaster recovery runbook |

---

_This document is maintained by the Engineering Team and reviewed quarterly._
