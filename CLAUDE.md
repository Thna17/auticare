# AutiCare: project guide for a new chat

Read this first. It explains what the project is, how it is built, the rules it
follows, and where things stand. For anything deeper, follow the links.

## What AutiCare is

A web platform in **Khmer and English** that supports families in Cambodia whose
young children may be autistic, during the weeks between first noticing
something and being seen by a specialist. It is **educational, never
diagnostic**. Nothing in the product may call its output a diagnosis, a
severity score or a treatment.

Five kinds of account, all stored in the `Parent` table with a `role`:

| Role       | Who                                                                | How the account is created                                                                                                                    |
| ---------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `PARENT`   | parents and caregivers                                             | self sign-up by email                                                                                                                         |
| `SCHOOL`   | school admin or teacher (`SchoolStaff.role` = `ADMIN` / `TEACHER`) | school requests an account, the AutiCare admin approves; teachers get a **username + one-time setup code** from their school admin (no email) |
| `HOSPITAL` | hospital admin, coordinator or doctor (`HospitalStaff.role`)       | hospital requests an account, the AutiCare admin approves                                                                                     |
| `ADMIN`    | the AutiCare team                                                  | seeded from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `.env`                                                                              |

Core flows:

- **Parent:** sign up → first-run check-in at `/welcome` (10 short questions per
  child) → dashboard, behaviour notes, AI assistant, activities, Find Support,
  reports.
- **School:** the admin creates teacher accounts and family connection codes. A
  parent enters a code and consents, and only then can the school see that
  child. Teachers report on the children assigned to them.
- **Plans:** Free / **Pro** ($20 a month or $200 a year, at most **2 children**) /
  **Business** for schools ($60 or $600, includes **5 sponsored Pro family
  accounts**, not teacher seats). There are **no online payments yet**: the
  admin records plans by hand.

## Stack and layout

pnpm monorepo:

```
apps/api      Express + TypeScript + Prisma + MySQL   (src/modules/<feature>/…)
apps/web      Angular 20, standalone components        (src/app/features/<feature>/…)
packages/contracts  zod schemas + types shared by api and web
docs/         architecture, decisions (ADRs), missing-features.md (the to-do list)
prototype/    early static prototype (not used by the app)
```

- **API module pattern:** `*.routes.ts` → `*.controller.ts` → `*.service.ts` →
  `*.repository.ts`. Routes use `requireAuth`, `requireRole(...)` and
  `validateBody(zodSchema)`. Services check ownership and role again. Responses
  are `{ data, meta }`; errors are `{ error: { code, message } }`
  (see `common/errors/app-error.ts`).
- **Web:** standalone components, signals, `ChangeDetectionStrategy.OnPush`,
  `@if` / `@for` control flow, page copy inline as `currentLang() === 'km' ? … : …`.
  Shell and sidebar: `core/layout/app-shell.component.ts`. Shared sidebar labels:
  `core/i18n/i18n.dictionary.ts`.
- **Contracts:** `packages/contracts/src/index.ts`, plus `plans.ts` (prices and
  limits with no zod, safe for the web to import), `admin-portal.ts` and
  `parent-portal.ts`. Rebuild after editing: `pnpm --filter @auticare/contracts build`.

## Commands

```
pnpm dev                                  # web on :4200 + api on :3000
pnpm --filter @auticare/web start         # web only
pnpm --filter @auticare/web test          # web tests (always via pnpm, not vitest directly)
pnpm --filter @auticare/web lint
pnpm --filter @auticare/web build
pnpm lint:colours                         # no raw colours allowed (see Rules)
pnpm --filter @auticare/api typecheck
pnpm --filter @auticare/api lint
pnpm --filter @auticare/api test:unit
pnpm --filter @auticare/api test:integration   # needs the database
pnpm check:migrations
pnpm --filter @auticare/api db:deploy     # apply migrations
pnpm --filter @auticare/api db:seed
```

Run one integration file:
`cd apps/api && npx dotenv -e ../../.env -- vitest run src/tests/integration/<file>.test.ts`

**Local database:** MySQL 8.4 in Docker (`docker compose up -d mysql`), on
`127.0.0.1:3308`, database `auticare`. Data lives in the volume
`auticare_auticare_mysql`. Prisma refuses AI-run `migrate reset` unless the user
has explicitly agreed. Never drop data without asking.

**No backend? Use preview mode (development builds only):**

- `http://localhost:4200/preview`: open any role's dashboard with sample data
  (code in `apps/web/src/app/core/preview/`). Uncovered requests fail with a clear
  503 "needs the backend".
- `http://localhost:4200/preview/welcome`: the first-run questionnaire with
  sample data.

## Rules (please keep them)

1. **Non-diagnostic language everywhere**, including AI prompts
   (`apps/api/src/modules/ai/ai.prompt.ts`, `RULES`).
2. **Privacy:**
   - No child data reaches a school without the parent's code and consent.
   - Admin views show counts, never a child's records.
   - Scope checks **fail closed**: a missing id or scope returns nothing or 404,
     never "everything".
3. **Server-side checks** for every protected action. Hidden buttons are not
   security. Plan limits live in
   `apps/api/src/modules/subscriptions/entitlements.service.ts`.
4. **Every new API route:**
   - is documented in `apps/api/src/config/openapi.ts`;
   - has its mount prefix added to `candidates` in
     `src/tests/integration/openapi-drift.test.ts`, or the drift test fails.
5. **Migrations:** create them with `prisma migrate dev --create-only` (or
   `migrate diff`), read the SQL, apply with `db:deploy`. Additive only unless the
   user agrees. Folders are named `YYYYMMDDHHMMSS_name`.
6. **Colours** come only from design tokens
   (`apps/web/src/app/design-system/styles/tokens.scss`). For transparency, use
   `color-mix(in srgb, var(--ac-…) 20%, transparent)`. Hex, `rgb()` and `white` /
   `black` fail `lint:colours`.
7. **Bilingual:** every user-facing string has English and Khmer. When animating
   Khmer text, split by grapheme (`Intl.Segmenter`), never by code unit.
8. **Accessibility:** real buttons and links, labels on inputs, visible focus,
   `prefers-reduced-motion` respected.
9. **Keep existing comments and tests** unless the code they describe is gone.
   Match the surrounding comment style.
10. **Sticky elements:** never put `overflow: hidden` on a section containing
    something sticky; use `overflow: clip`.
11. **Line endings:** files are a mix of CRLF and LF. Preserve them. Prettier
    may convert a file to LF.
12. **Edit scripts:** when editing with `node -e`, beware that `$'` in a
    `String.replace` replacement inserts the rest of the string. Use a function
    replacer (`s.replace(a, () => b)`). Write regexes and backslashes from a
    script file, not inline shell.

## Git and workflow

- **Commit or push only when the user asks.** Branch from `main` for bigger work.
- **Commit messages are checked by commitlint:** `feat|fix|docs|chore|refactor|test(scope): …`.
  `merge:` is rejected; use `chore(merge): …`. End messages with
  `Co-Authored-By: Claude …`.
- **Before calling work done:** web tests, web lint, colour lint, web build, API
  typecheck, API lint, unit tests, and the relevant integration tests.
- **Gemini:** the user often gives big builds to Gemini (Antigravity). Claude
  writes the prompt, then reviews Gemini's work. Past reviews found deleted
  comments, missing imports, fake "saved" UI, privacy leaks in notifications, and
  wrong error-message paths (`err.error.error.message` is correct). Review
  carefully.
- **Ask before** creating extra folders, git worktrees or databases.
- **The user is not always technical.** When explaining how to test, give exact
  places: the sidebar item, the URL, the role to log in as.

## Product decisions already made (do not reopen without the user)

- **School sign-up:** keep the public request forms (`/register-school`,
  `/register-hospital`). They create requests; the admin verifies and approves.
- **Teachers:** keep username + setup code (no email invites).
- **Hospitals:** no subscription plan for now.
- **Payments:** on hold. No gateway, invoices or Payments page yet.
- **Free plan limits:** not decided. `FREE_PLAN_CHILD_LIMIT` is empty, so there
  is no limit.
- **Past due:** gives no access (no grace period has been decided).
- **Deferred by the user:** Admin Team & Roles, MFA, Platform Settings,
  directory review, data export/deletion requests.

## Where things stand

- **To-do list:** `docs/missing-features.md` (tick items as they ship). Largest
  gaps:
  - landing page sections;
  - **School Admin portal** (report approval workflow, student access status);
  - **Teacher portal** (report form fields, statuses);
  - the admin Inquiries inbox.
- **Done:** Admin portal, Parent portal (built by Gemini, reviewed), subscriptions
  phase 1, hospital teams, role-based sidebars, animated landing sections.
- **Known failing tests:** 3–4 integration tests about concurrent booking and
  admission requests fail on local MySQL; school and hospital registration tests
  are flaky only when every file runs together.
- **Work in progress, not committed (as of 2026-10-28):**
  - About Us page started at `apps/web/src/app/features/about/` (first section
    only, no route yet).
  - Preview mode.
  - The split-screen first-run questionnaire.
- **Deploying:** run `db:deploy` on the server, and set `SEED_ADMIN_*` for the
  first admin.

## Deeper reading

- `docs/architecture/*.md`: backend, frontend, database, security, module boundaries
- `docs/decisions/ADR-*.md`: why the stack is what it is
- `README.md`: setup and local accounts
- `docs/project-planner.md`: product direction (written for an outside reviewer)
