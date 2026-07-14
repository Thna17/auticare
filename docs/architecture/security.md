# Security Architecture

Passwords use Argon2id. JWTs are stored in HTTP-only cookies, never localStorage. Refresh tokens are hashed before storage. Helmet, CORS allow-listing, request size limits, rate limits, request IDs, structured redacted logs, and consistent errors are configured. CSRF protection should be added before cross-site deployments.
