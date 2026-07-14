# Contributing

Use vertical feature ownership: database, backend, contracts, frontend data access, state, UI, tests, and docs move together.

Branches: `feature/<module>-<description>`, `fix/<module>-<description>`, `refactor/<module>-<description>`, `docs/<description>`, `chore/<description>`.

Commits use Conventional Commits, such as `feat(screening): add screening submission` or `test(children): verify profile ownership`.

PRs should be focused, reviewed, documented, tested, and never merged with failing CI. Shared contracts and schema changes should receive two reviewers where possible. Use squash merge. Never edit a migration another developer has used; create a corrective migration.
