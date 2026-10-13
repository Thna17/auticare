# Production Deployment Runbook

This runbook guides operators through preparing, executing, verifying, and troubleshooting deployments of the AutiCare application suite.

---

## 1. System Architecture Overview

AutiCare production deployments consist of three core tiers:

- **Web Frontend (`@auticare/web`)**: Standalone SPA served via Nginx Alpine on Port 80/443 with strict Content Security Policy and aggressive immutable caching for hashed bundles.
- **Backend API (`@auticare/api`)**: Node.js 22 LTS container managed by `dumb-init`, running Express 5, Prisma ORM, and Pino structured logging on Port 3000.
- **Database (`MySQL 8.4 LTS`)**: InnoDB transactional database with utf8mb4 encoding, strict SQL modes, and connection pooling.
- **Object Storage (`S3 / MinIO / Local`)**: File storage for clinical report attachments with cryptographic signature verification and TTL cleanup.

---

## 2. Pre-Flight Verification Checklist

Before initiating any deployment to staging or production:

1. **Verify Git SHA & Working Tree**:
   ```bash
   git status --porcelain
   git rev-parse HEAD
   ```
2. **Generate Cryptographic Production Secrets**:
   If generating new production credentials, use the automated generator to create 64-character hex secrets:

   ```bash
   pnpm prod:secrets
   # Writes to .env.production with 0600 file permissions
   ```

3. **Execute Full Local & Pre-Flight Validation**:

   ```bash
   pnpm validate
   pnpm prod:validate --env-file .env.production
   ```

4. **Verify OpenAPI Drift**:

   ```bash
   pnpm check:openapi
   ```

5. **Inspect Pending Database Migrations**:

   ```bash
   pnpm --filter @auticare/api db:deploy --dry-run
   ```

   Ensure all pending migrations adhere to the [Expand/Contract Migration Strategy](./migration-strategy.md).

6. **Verify Environment Variables**:
   Confirm that all mandatory variables defined in `apps/api/src/config/env.ts` are set and validated via `pnpm prod:validate`:
   - `JWT_ACCESS_SECRET` (64 hex characters, cannot contain "dev" or "test")
   - `JWT_REFRESH_SECRET` (64 hex characters, cannot contain "dev" or "test")
   - `DATABASE_URL` (MySQL with valid credentials & connection pool parameters)
   - `APP_ORIGIN` & `API_ORIGIN` (valid production HTTPS URLs)
   - `STORAGE_DRIVER` (`s3` in production with bucket, region, and access keys)

---

## 3. Deployment Procedure (Zero-Downtime Rolling Update)

### Step 3.1: Pre-Deployment Backup

Create an instantaneous logical backup and snapshot before applying schema changes:

```bash
docker exec -t auticare-mysql-1 mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" \
  --single-transaction --quick --routines --triggers --hex-blob auticare > \
  backup_pre_deploy_$(date +%Y%m%d_%H%M%S).sql
```

### Step 3.2: Automated Database Migration & Container Rollout

In production compose (`docker-compose.prod.yml`), the idempotent `migration-runner` service automatically executes `pnpm --filter @auticare/api db:deploy` prior to the API container launch:

```bash
# Build and roll application containers (migration-runner executes first)
docker compose --env-file .env.production -f docker-compose.prod.yml build
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --remove-orphans
```

---

## 4. Post-Deployment Smoke Testing & Health Checks

Execute the automated end-to-end smoke test suite to probe all tiers simultaneously:

```bash
# Automated HTTP probe suite (Nginx health, API liveness, DB readiness, reverse proxy, SPA fallback)
pnpm prod:smoke --web-url http://localhost:80 --api-url http://localhost:3000
```

Individual service-level manual checks:

1. **API Liveness Probe**:

   ```bash
   curl -I http://localhost:3000/health/live
   # Expect: HTTP 200 OK {"data": {"status": "live", "uptime": ...}}
   ```

2. **API Readiness Probe**:

   ```bash
   curl -I http://localhost:3000/health/ready
   # Expect: HTTP 200 OK {"data": {"status": "ready", "database": "connected"}}
   ```

3. **API Metrics Endpoint**:

   ```bash
   curl -s http://localhost:3000/health/metrics | jq .
   # Expect: System uptime, memory RSS/heap, environment 'production'
   ```

4. **Web Nginx Health Probe**:

   ```bash
   curl -I http://localhost/nginx-health
   # Expect: HTTP 200 OK
   ```

5. **Client Error Telemetry**:
   The web application features an Angular `GlobalErrorHandler` boundary. Any unexpected client-side exceptions emit structured telemetry logs tagged `[AutiCare Telemetry: Uncaught Client Error]` and display non-intrusive bilingual toast recovery banners.

---

## 5. Rollback Procedures

If any critical probe or smoke test fails post-deployment:

### Immediate Application Rollback:

```bash
# Roll back container images to previous stable release tag
docker compose -f docker-compose.prod.yml stop api web
docker compose -f docker-compose.prod.yml up -d --no-build
```

### Database Rollback:

If a migration was executed that caused database corruption or application failure:

1. Stop API traffic to prevent concurrent state corruption:
   ```bash
   docker compose -f docker-compose.prod.yml stop api
   ```
2. Restore the pre-deployment database backup:
   ```bash
   docker exec -i auticare-mysql-1 mysql -u root -p"$MYSQL_ROOT_PASSWORD" auticare < backup_pre_deploy_<TIMESTAMP>.sql
   ```
3. Restart API containers:
   ```bash
   docker compose -f docker-compose.prod.yml start api
   ```

---

## 6. Incident Triage & Troubleshooting Matrix

| Symptom                             | Root Cause Candidates                            | Diagnostic Command                             | Remediation                                                          |
| :---------------------------------- | :----------------------------------------------- | :--------------------------------------------- | :------------------------------------------------------------------- |
| **502 Bad Gateway on Web**          | API container stopped or failing readiness probe | `docker logs auticare-api --tail 100`          | Check database connectivity or unhandled boot exception.             |
| **API Readiness probe returns 503** | MySQL connection pool exhausted or Storage down  | `curl -s http://localhost:3000/health/ready`   | Check `DATABASE_URL` credentials or S3 endpoint reachability.        |
| **High Memory / OOM Kill**          | Node memory limit exceeded or leak               | `curl -s http://localhost:3000/health/metrics` | Inspect heap metrics; restart container with higher resource limits. |
| **Rate Limit 429 Errors**           | Spiky traffic or unauthenticated bot crawl       | Inspect access logs for high-frequency IPs     | Adjust `generalRateLimit` in `common/security/rate-limits.ts`.       |
