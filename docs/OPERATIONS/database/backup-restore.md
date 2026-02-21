# Database Backup and Restore Procedures

This document outlines the backup and restore procedures for the Gebeta Restaurant OS database.

## Overview

Gebeta Restaurant OS uses Supabase (PostgreSQL) as its primary database. Supabase provides automatic backup capabilities, and we also maintain manual backup procedures for additional safety.

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

- **Frequency**: Daily (automatic)
- **Retention**: Based on Supabase plan
- **Location**: Supabase-managed storage

### Accessing Backups

1. Navigate to Supabase Dashboard
2. Go to Project Settings > Database > Backups
3. View available backup snapshots

---

## Manual Backup Procedures

### Using pg_dump

```bash
# Full database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Schema-only backup
pg_dump --schema-only $DATABASE_URL > schema_backup.sql

# Data-only backup
pg_dump --data-only $DATABASE_URL > data_backup.sql
```

### Using Supabase CLI

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Create a backup
supabase db dump -f backup_$(date +%Y%m%d).sql
```

### Backup Script

Create a backup script at `scripts/backup-database.sh`:

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/gebeta_backup_${TIMESTAMP}.sql.gz"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create backup
echo "Creating database backup..."
pg_dump $DATABASE_URL | gzip > $BACKUP_FILE

# Verify backup
if [ -f $BACKUP_FILE ]; then
    echo "Backup created successfully: $BACKUP_FILE"
    echo "Size: $(du -h $BACKUP_FILE | cut -f1)"
else
    echo "Backup failed!"
    exit 1
fi

# Clean up old backups (keep last 30 days)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed."
```

---

## Restore Procedures

### Using psql

```bash
# Restore from backup file
psql $DATABASE_URL < backup_20260218.sql

# Restore compressed backup
gunzip -c backup_20260218.sql.gz | psql $DATABASE_URL
```

### Using Supabase Dashboard

1. Navigate to Project Settings > Database > Backups
2. Select the backup to restore from
3. Click "Restore" and confirm
4. Wait for the restoration to complete

### Point-in-Time Recovery (PITR)

For Pro and Team plans:

```bash
# Restore to specific timestamp
supabase db restore --timestamp "2026-02-18 10:30:00"
```

---

## Disaster Recovery

### Recovery Time Objective (RTO)

- **Target**: 1 hour
- **Maximum Acceptable**: 4 hours

### Recovery Point Objective (RPO)

- **Target**: 1 hour (with PITR)
- **Maximum Acceptable**: 24 hours (daily backups)

### Disaster Recovery Steps

1. **Assess the situation**
    - Determine the scope of data loss
    - Identify the cause
    - Notify stakeholders

2. **Contact Supabase Support**
    - Open a support ticket
    - Provide details of the incident
    - Request assistance if needed

3. **Restore from backup**

    ```bash
    # Stop application to prevent conflicts
    # Then restore from most recent valid backup
    psql $DATABASE_URL < backup_latest.sql
    ```

4. **Verify restoration**
    - Check critical tables
    - Verify data integrity
    - Test application functionality

5. **Resume operations**
    - Restart application
    - Monitor for issues
    - Document incident

---

## Backup Verification

### Regular Testing

Backups should be tested monthly to ensure they can be restored successfully.

```bash
# Create a test database
createdb test_restore

# Restore backup to test database
psql test_restore < backup_latest.sql

# Run integrity checks
psql test_restore -c "SELECT COUNT(*) FROM restaurants;"
psql test_restore -c "SELECT COUNT(*) FROM orders;"

# Clean up
dropdb test_restore
```

### Automated Verification

Add to CI/CD pipeline:

```yaml
# .github/workflows/backup-verify.yml
name: Verify Backup

on:
    schedule:
        - cron: '0 0 * * 0' # Weekly

jobs:
    verify:
        runs-on: ubuntu-latest
        steps:
            - name: Download latest backup
              run: |
                  # Download backup from storage

            - name: Verify backup integrity
              run: |
                  pg_restore --list backup.sql | head -n 20
```

---

## Backup Checklist

- [ ] Daily automated backups running
- [ ] Backup retention policy configured
- [ ] Backup verification tested monthly
- [ ] Disaster recovery plan documented
- [ ] Team trained on restore procedures
- [ ] Contact information for Supabase support available

---

## Contacts

- **Supabase Support**: support@supabase.com
- **Internal Database Team**: [Update with team contact]

---

## Revision History

| Date       | Author           | Changes               |
| ---------- | ---------------- | --------------------- |
| 2026-02-18 | Engineering Team | Initial documentation |

---

_This document is maintained by the Engineering Team and reviewed quarterly._
