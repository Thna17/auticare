# Module Boundaries

Modules expose only deliberate public APIs from `index.ts`: application services, query interfaces, command interfaces, or future in-process domain events. Controllers, routes, Prisma repositories, schemas, and internal entities remain private. External brokers are intentionally excluded.
