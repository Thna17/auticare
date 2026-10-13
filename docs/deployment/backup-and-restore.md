# Backup and Disaster Recovery Strategy

This document outlines the backup policies, replication topology, point-in-time recovery procedures, and recovery objectives (RTO/RPO) for AutiCare production infrastructure.

---

## 1. Service Level Objectives

- **Recovery Point Objective (RPO)**: $\le 15\text{ minutes}$ (maximum acceptable data loss window).
- **Recovery Time Objective (RTO)**: $\le 60\text{ minutes}$ (maximum acceptable downtime to restore operations).

---

## 2. Backup Topology & Cadence

### 2.1 MySQL Database Tier

- **Full Logical Backups**: Executed every 24 hours at 01:00 UTC using `mysqldump` with `--single-transaction`. Encrypted using AES-256 and stored off-site in S3 Glacier.
- **Binary Logs (Point-in-Time Recovery)**: Continuous MySQL binary logging enabled (`binlog_format=ROW`) with 7-day retention. Binary logs stream to secondary object storage every 5 minutes.
- **Automated Snapshots**: Cloud EBS/RDS volume snapshots every 6 hours with 30-day retention.

### 2.2 Object Storage Tier (Clinical Attachments)

- S3 Bucket versioning enabled with MFA Delete.
- Cross-region replication (CRR) to a secondary cloud region.
- Immutable Object Lock with compliance mode enabled for finalized medical and educational reports.

---

## 3. Automated Backup Script Example

```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/var/backups/auticare"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="auticare_db_${TIMESTAMP}.sql.gz"
S3_DEST="s3://${STORAGE_BACKUP_BUCKET}/db-backups/${FILENAME}"

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting MySQL backup..."
mysqldump \
  --host="${DB_HOST:-127.0.0.1}" \
  --port="${DB_PORT:-3306}" \
  --user="${DB_USER:-auticare}" \
  --password="${DB_PASSWORD}" \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  --hex-blob \
  --databases auticare | gzip -9 > "${BACKUP_DIR}/${FILENAME}"

echo "[$(date)] Uploading to secure S3 storage..."
aws s3 cp "${BACKUP_DIR}/${FILENAME}" "${S3_DEST}" --sse aws:kms

echo "[$(date)] Backup completed successfully: ${S3_DEST}"
rm -f "${BACKUP_DIR}/${FILENAME}"
```

---

## 4. Disaster Recovery & Restoration Procedures

### 4.1 Full Restoration from Logical Dump

1. **Stop Application Traffic**:

   ```bash
   docker compose -f docker-compose.prod.yml stop api web
   ```

2. **Download & Decrypt Latest Backup**:

   ```bash
   aws s3 cp s3://${STORAGE_BACKUP_BUCKET}/db-backups/auticare_db_LATEST.sql.gz ./
   gunzip auticare_db_LATEST.sql.gz
   ```

3. **Restore MySQL Database**:

   ```bash
   mysql --host="${DB_HOST}" -u root -p"${MYSQL_ROOT_PASSWORD}" auticare < auticare_db_LATEST.sql
   ```

4. **Verify Schema & Record Consistency**:

   ```sql
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM children;
   SELECT COUNT(*) FROM appointments;
   ```

5. **Execute Pending Migrations (if applicable)**:

   ```bash
   docker compose -f docker-compose.prod.yml run --rm api pnpm --filter @auticare/api db:deploy
   ```

6. **Restart Application Services & Run Smoke Probes**:
   ```bash
   docker compose -f docker-compose.prod.yml start api web
   curl -f http://localhost:3000/health/ready
   ```

---

## 5. Verification & Drill Scheduling

- **Automated Verification**: Weekly restore test executed inside an isolated CI/CD staging sandbox to verify database checksums and migration compatibility.
- **Manual DR Drill**: Semi-annual simulated failover exercise conducted by the engineering and DevOps team.
