# Architecture Overview

AutiCare uses a pnpm monorepo and modular-monolith backend. The API runs as one Express process while domains are separated into modules. Angular uses standalone components, lazy feature routes, reactive forms, signals, RxJS, and shared contracts. Authentication uses short-lived access JWTs and refresh-token foundations in secure HTTP-only cookies.
