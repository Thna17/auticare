# AutiCare

AutiCare is a modular monolith web application foundation for parents and caregivers seeking autism-related support. Screening content is informational and is not a medical diagnosis.

## Stack

Angular standalone frontend, Express 5 TypeScript API, Prisma, MySQL 8, Zod, Pino, secure cookie JWT auth, shared contracts, Docker Compose, ESLint, Prettier, Husky, Commitlint, Vitest, Supertest, and Playwright setup.

## Setup

```bash
pnpm install
cp .env.example .env
pnpm docker:up
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Endpoints: frontend `http://localhost:4200`, backend `http://localhost:3000`, API `http://localhost:3000/api/v1`, OpenAPI `http://localhost:3000/api/docs`, health `http://localhost:3000/health/live`.

## Commands

```bash
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm validate
```

See `docs/development/team-ownership.md` for the four-member ownership model.
