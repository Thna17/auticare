# AutiCare

AutiCare is a family-support platform for organising child profiles, care information, screening support, school activity reports, and care-provider discovery. It is a pnpm monorepo with an Angular web application, an Express API, MySQL, Prisma, and a shared contracts package.

> **Medical notice:** AutiCare screening is informational support only. It is not a medical diagnosis and must not replace advice, diagnosis, or treatment from a qualified clinician.

## What is implemented

- Secure cookie-based authentication with access tokens, refresh-token rotation, logout, and password reset
- Gmail-compatible SMTP delivery for password-reset links
- Role-based API authorization for `PARENT`, `ADMIN`, and `SCHOOL`
- Parent registration, login, profile management, and child-profile creation, editing, and archiving
- Parent dashboard with child context, screening progress, care actions, and responsive navigation
- Administrator dashboard and hospital directory management
- Hospital directory that parents can browse and administrators can publish to
- School staff, enrollment, and school activity-report API flows
- Shared Zod schemas and TypeScript contracts between frontend and backend
- API integration tests for authentication, refresh rotation, child ownership, password reset, schools, and hospital authorization

## Product flows

| Role     | What the role can do                                                                                            |
| -------- | --------------------------------------------------------------------------------------------------------------- |
| `PARENT` | Register, log in, manage their own child profiles, use the parent dashboard, and browse the hospital directory. |
| `ADMIN`  | Log in to the administrator dashboard, review active child profiles, and create hospitals in the directory.     |
| `SCHOOL` | Authenticate as school staff and create activity reports for enrolled children through the protected API flow.  |

Public sign-up always creates a `PARENT` account. Administrator and school accounts must be provisioned by a trusted backend or administrative process; they must never be exposed through public registration.

## Architecture

```text
AutiCare/
├── apps/
│   ├── api/             Express 5 API, Prisma, MySQL integration
│   └── web/             Angular standalone application
├── packages/
│   └── contracts/       Shared Zod schemas and TypeScript types
├── docs/                Architecture and team-development notes
├── docker-compose.yml   Local MySQL 8.4 service
└── pnpm-workspace.yaml
```

The shared `@auticare/contracts` package is the API boundary: request validation and response types are defined once and consumed by both applications.

## Technology

- Angular standalone components and local component styles
- Express 5, TypeScript, Zod, Pino, Helmet, CORS, and rate limits
- Prisma with MySQL 8.4
- Argon2 password hashing and HTTP-only session cookies
- Nodemailer for SMTP password-reset delivery
- pnpm workspaces, ESLint, Prettier, Husky, Vitest, Supertest, and Playwright tooling

## Prerequisites

- Node.js 22 or newer
- pnpm 9 (`corepack enable` is recommended)
- Docker Desktop

## Local setup

1. Install dependencies and create your local environment file.

   ```bash
   pnpm install
   cp .env.example .env
   ```

2. Set real secrets in `.env` before running the API. `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` must each be at least 32 characters. Never commit `.env`.

3. Start MySQL, generate Prisma Client, apply migrations, and load local development data.

   ```bash
   pnpm docker:up
   pnpm db:generate
   pnpm db:migrate
   pnpm db:seed
   ```

4. Run the frontend and API together.

   ```bash
   pnpm dev
   ```

Open these local services:

| Service    | URL                                |
| ---------- | ---------------------------------- |
| Web app    | http://localhost:4200              |
| API        | http://localhost:3000              |
| API health | http://localhost:3000/health/ready |
| OpenAPI UI | http://localhost:3000/api/docs     |

Stop the database with `pnpm docker:down` when you are finished.

## Local accounts

After `pnpm db:seed`, use these development-only accounts:

| Role          | Email                        | Password                    |
| ------------- | ---------------------------- | --------------------------- |
| Parent        | `demo.parent@auticare.local` | `AutiCareDemoPassword123`   |
| Administrator | `admin@auticare.local`       | `AutiCareAdminPassword123`  |
| School staff  | `school@auticare.local`      | `AutiCareSchoolPassword123` |

These credentials are for the local seeded database only. Do not reuse them in deployed environments.

## Password-reset email

The reset-password flow sends mail whenever SMTP is configured. For Gmail, create an app password in the Google account with two-step verification enabled, then set these values in your local `.env`:

```dotenv
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-account@gmail.com
SMTP_PASS=your-google-app-password
SMTP_FROM=AutiCare <your-account@gmail.com>
```

Port `587` uses STARTTLS. Do not commit a real SMTP password, place it in screenshots, or put it in source code. Tests never send email; they keep a deterministic local reset-token flow.

## Test the main flows

### Parent: create a child profile

1. Log in with the seeded parent account.
2. Open **My Children** from the sidebar.
3. Select **Add child**.
4. Enter a first name and date of birth, then select **Create child profile**.
5. Review, update, or archive the child from the resulting profile page.

### Administrator: add a hospital

1. Log in with the seeded administrator account.
2. From the administrator dashboard, select **Manage hospitals**. You can also use **Hospitals** in the sidebar.
3. Complete the hospital name, city, address, and services fields.
4. Select **Add hospital**. The provider appears immediately in the directory.
5. Log in as a parent and open **Hospitals** to confirm the provider is visible. Parents can view the directory but cannot create hospitals.

## Commands

| Command            | Purpose                                                                          |
| ------------------ | -------------------------------------------------------------------------------- |
| `pnpm dev`         | Run the Angular web app and Express API in watch mode.                           |
| `pnpm build`       | Build contracts, API, and web app.                                               |
| `pnpm lint`        | Lint API and web source.                                                         |
| `pnpm typecheck`   | Type-check every workspace.                                                      |
| `pnpm test`        | Run unit and API integration tests.                                              |
| `pnpm test:e2e`    | Run the configured web end-to-end command.                                       |
| `pnpm validate`    | Run formatting checks, linting, type checks, unit tests, and a production build. |
| `pnpm db:generate` | Generate Prisma Client.                                                          |
| `pnpm db:migrate`  | Create and apply a development migration.                                        |
| `pnpm db:deploy`   | Apply committed migrations without creating a new one.                           |
| `pnpm db:seed`     | Seed local development data.                                                     |
| `pnpm db:studio`   | Open Prisma Studio.                                                              |
| `pnpm docker:up`   | Start local MySQL.                                                               |
| `pnpm docker:down` | Stop local MySQL.                                                                |

For a focused API check:

```bash
pnpm --filter @auticare/api test:integration
pnpm --filter @auticare/web lint
pnpm --filter @auticare/web typecheck
pnpm --filter @auticare/web build
```

## Security and data-handling notes

- Passwords are hashed with Argon2 and are never logged.
- Authentication cookies are HTTP-only and refresh tokens rotate on use.
- Password reset tokens are stored as hashes, expire, and are single-use.
- API authorization is enforced on the server; hiding an action in the UI is not considered security.
- Keep production secrets in the deployment platform's secret manager, not in `.env` files committed to Git.
- Do not treat screening output as a diagnosis or clinical recommendation.

## Development conventions

- Keep backend modules in `apps/api/src/modules/<feature>` with routes, controller, service, repository, schemas, and mapper responsibilities separated where useful.
- Keep Angular features under `apps/web/src/app/features/<feature>` and prefer standalone components with local styles.
- Add or update shared request/response definitions in `packages/contracts` whenever an API contract changes.
- Add integration coverage for authorization, ownership, and externally visible workflow changes.
- Run `pnpm validate` before opening a pull request.

See [team ownership](docs/development/team-ownership.md), [definition of done](docs/development/definition-of-done.md), and [database notes](docs/architecture/database.md) for project conventions.

## Current status

The authentication, parent child-profile, administrator hospital-directory, and core school activity-report API flows are implemented. Several navigation destinations remain intentionally scoped for future feature work; their presence in navigation does not imply that every corresponding workflow is complete.
