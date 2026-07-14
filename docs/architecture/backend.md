# Backend Architecture

Express handles HTTP routing and middleware. Controllers map HTTP concerns only, services orchestrate use cases, repositories own persistence, and Prisma records are mapped to public DTOs before leaving the API. Errors use a consistent envelope and production responses avoid stack traces or internal database errors.
