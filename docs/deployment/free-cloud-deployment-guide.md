# 100% Free Cloud Deployment Guide for AutiCare

This guide walks you through deploying the complete AutiCare full-stack platform (**MySQL Database**, **Express API Backend**, and **Angular SPA Frontend**) to free-tier cloud hosting with **$0 monthly cost** and **no credit card required** to get started.

---

## Architecture Overview (Free Cloud Stack)

```
┌─────────────────────────────────────────────────────────────┐
│                      End Users                              │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND (Free Edge CDN): Vercel or Render Static Site      │
│ • Domain: https://auticare.vercel.app                       │
│ • Serves: Angular 19 SPA bundles with Gzip/Brotli           │
│ • Reverse-proxy: Rewrites /api/* to Render Backend          │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / Proxied API Calls
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND (Free Web Service): Render.com                      │
│ • Domain: https://auticare-api.onrender.com                 │
│ • Runtime: Docker container (Dockerfile.api)                │
│ • Manages: JWT auth, REST endpoints, Pino logging           │
└──────────────────────────────┬──────────────────────────────┘
                               │ TLS / Port 4000 (MySQL Wire)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ DATABASE (Free Cloud MySQL): TiDB Cloud Serverless or Aiven │
│ • 5 GB Storage Free Forever                                 │
│ • 100% MySQL 8.0 Wire-Compatible                            │
│ • Built-in TLS encryption & auto-scaling                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 1: Create a Free Cloud MySQL Database

We recommend **TiDB Cloud Serverless** because it is 100% MySQL 8.0 compatible, gives you **5 GB free forever**, requires **no credit card**, and connects seamlessly to Prisma ORM.

### 1.1 Create your database cluster:

1. Go to [https://tidbcloud.com](https://tidbcloud.com) and sign up (Free).
2. Click **Create Cluster** and select **Serverless (Free Forever)**.
3. Choose your nearest region (e.g. `ap-southeast-1` Singapore or `us-east-1`).
4. Click **Create**. Your MySQL cluster will be ready in ~15 seconds.

### 1.2 Get your Connection String:

1. In the TiDB Cloud dashboard, click **Connect**.
2. Select **Prisma** or **General MySQL**.
3. Generate a strong password and copy the connection string. It will look like:
   ```text
   mysql://<username>.<root>:<password>@gateway01.<region>.prod.aws.tidbcloud.com:4000/auticare?sslaccept=strict
   ```

### 1.3 Deploy database schema from your machine:

Before starting the backend, push the AutiCare Prisma database schema and migrations to your new cloud database:

```bash
# In your local project directory:
DATABASE_URL="your-tidb-cloud-connection-string" pnpm --filter @auticare/api db:deploy

# (Optional) Seed partner Cambodian hospitals, inclusive schools, and sensory play routines:
DATABASE_URL="your-tidb-cloud-connection-string" pnpm --filter @auticare/api db:seed
```

---

## Step 2: Deploy Backend API on Render (Free)

Render offers free Docker & Node.js Web Services with automatic HTTPS.

### 2.1 Push your code to GitHub:

Make sure your AutiCare repository is pushed to your personal GitHub or GitLab account:

```bash
git add .
git commit -m "feat: prepare production cloud deployment"
git push origin main
```

### 2.2 Create Web Service on Render:

1. Go to [https://dashboard.render.com](https://dashboard.render.com) and sign in.
2. Click **New +** → **Web Service**.
3. Connect your **AutiCare** GitHub repository.
4. Configure the service settings:
   - **Name**: `auticare-api` (or your preferred name)
   - **Region**: Same as your database (e.g., `Singapore` or `Oregon`)
   - **Branch**: `main`
   - **Runtime**: **Docker**
   - **Dockerfile Path**: `./Dockerfile.api`
   - **Docker Context**: `.`
   - **Instance Type**: **Free** ($0/month)

### 2.3 Set Environment Variables on Render:

Scroll down to the **Environment Variables** section and add the following keys:

| Environment Variable | Value                               | Notes                                       |
| :------------------- | :---------------------------------- | :------------------------------------------ |
| `NODE_ENV`           | `production`                        | Enables production optimizations            |
| `PORT`               | `3000`                              | Port Express listens on                     |
| `DATABASE_URL`       | `mysql://...`                       | Paste your TiDB Cloud connection string     |
| `JWT_ACCESS_SECRET`  | _(64-char hex string)_              | Run `pnpm prod:secrets` locally to generate |
| `JWT_REFRESH_SECRET` | _(64-char hex string)_              | Run `pnpm prod:secrets` locally to generate |
| `APP_ORIGIN`         | `https://auticare.vercel.app`       | Your frontend URL (from Step 3)             |
| `API_ORIGIN`         | `https://auticare-api.onrender.com` | Your Render API URL                         |
| `STORAGE_DRIVER`     | `local`                             | Uploads stored in container                 |
| `LOG_LEVEL`          | `info`                              | Structured logging level                    |
| `SMTP_HOST`          | `smtp.gmail.com`                    | _(Optional)_ Gmail SMTP host                |
| `SMTP_PORT`          | `587`                               | _(Optional)_ TLS port                       |
| `SMTP_USER`          | `your-email@gmail.com`              | _(Optional)_ Gmail address                  |
| `SMTP_PASS`          | `xxxx xxxx xxxx xxxx`               | _(Optional)_ 16-char Google App Password    |
| `SMTP_FROM`          | `AutiCare <your-email@gmail.com>`   | _(Optional)_ Sender header                  |

5. Click **Create Web Service**.
6. Render will build the Docker container and start your API. When the build finishes, you will see a green checkmark:
   ```text
   ==> Your service is live at https://auticare-api.onrender.com
   ```
7. Verify by opening `https://auticare-api.onrender.com/health/live` in your browser. You should receive:
   ```json
   { "data": { "status": "live", "uptime": 12, "version": "0.1.0" }, "meta": {} }
   ```

> [!TIP]
> **Render Free Tier Sleep Mode**: Free Render instances spin down after 15 minutes of inactivity. When a new request arrives, it takes ~30–40 seconds to spin back up ("cold start"). To keep it awake during clinical demonstrations, you can use a free uptime monitor like [UptimeRobot](https://uptimerobot.com) to ping `https://auticare-api.onrender.com/health/live` every 10 minutes.

---

## Step 3: Deploy Frontend on Vercel (Free)

Vercel provides the fastest free edge hosting for Angular SPAs.

### 3.1 Deploy via Vercel Dashboard:

1. Go to [https://vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New...** → **Project**.
3. Import your **AutiCare** repository.
4. In the Project Configuration:
   - **Framework Preset**: Other (or Angular)
   - **Root Directory**: `./` (leave at root so monorepo workspace installs dependencies)
   - **Build Command**: `pnpm build:web`
   - **Output Directory**: `apps/web/dist/web/browser`
   - **Install Command**: `pnpm install`

### 3.2 Configure API Proxy (`vercel.json`):

The repository already contains [`vercel.json`](../../vercel.json) in the project root. Make sure the rewrite destination points to your Render API domain:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://auticare-api.onrender.com/api/:path*"
    },
    {
      "source": "/health/:path*",
      "destination": "https://auticare-api.onrender.com/health/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

5. Click **Deploy**. Vercel will build the Angular SPA and deploy it to a global CDN (e.g., `https://auticare.vercel.app`).

---

## Step 4: Verify Your Live Deployment

Once both tiers are deployed, test your entire production deployment in one command using the automated smoke test suite:

```bash
pnpm prod:smoke \
  --web-url https://auticare.vercel.app \
  --api-url https://auticare-api.onrender.com
```

### Expected Output:

```text
🩺 AutiCare Production Smoke Test Probe Suite
==============================================
Target Web (Nginx / SPA): https://auticare.vercel.app
Target API (Express):     https://auticare-api.onrender.com
Probe Timeout:            10000ms

  ⏳ API Container Liveness Probe... ✓ PASSED - HTTP 200 OK (status: live)
  ⏳ API + Database Readiness Probe... ✓ PASSED - HTTP 200 OK (status: ready, database: connected)
  ⏳ API Endpoint via Reverse Proxy... ✓ PASSED - HTTP 200 OK (Loaded Cambodian institutions)
  ⏳ SPA Routing Fallback & Root HTML... ✓ PASSED - HTTP 200 OK (SPA delivered for /screening)
  ⏳ Hashed Static Asset Delivery... ✓ PASSED - HTTP 200 OK (styles.css, main.js delivered)

==============================================
🎉 ALL PRODUCTION SMOKE TEST PROBES PASSED!
```

---

## Alternative: 100% All-in-One Render Deployment

If you prefer to keep both the Backend and Frontend in **one single dashboard** on Render without using Vercel:

1. In Render Dashboard, click **New +** → **Static Site**.
2. Connect your **AutiCare** repository.
3. Settings:
   - **Build Command**: `pnpm build:web`
   - **Publish Directory**: `apps/web/dist/web/browser`
4. Under **Redirects / Rewrites**, add:
   - **Type**: Rewrite
   - **Source**: `/*`
   - **Destination**: `/index.html`
5. Click **Create Static Site**.

---

## Summary of Free Cloud Resources

| Layer        | Provider               | Free Tier Specification                             |      Cost      |
| :----------- | :--------------------- | :-------------------------------------------------- | :------------: |
| **Database** | TiDB Cloud Serverless  | 5 GB storage, 50M request units/mo, SSL/TLS         |     **$0**     |
| **Backend**  | Render.com             | 512 MB RAM, shared CPU, auto-SSL, Docker runtime    |     **$0**     |
| **Frontend** | Vercel / Render Static | Unlimited deployments, 100 GB bandwidth, Global CDN |     **$0**     |
| **Email**    | Gmail SMTP / Resend    | Free 500 emails/day (Gmail) or 3,000/mo (Resend)    |     **$0**     |
| **Total**    |                        |                                                     | **$0 / month** |
