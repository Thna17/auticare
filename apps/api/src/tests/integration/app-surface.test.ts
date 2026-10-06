import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../app.js';

describe('unknown routes', () => {
  // Express answers an unmatched path with an HTML page by default. The web
  // client reads the JSON error envelope, so a mistyped URL used to produce a
  // response it could not parse.
  it.each([
    ['a bare unknown path', '/nope'],
    ['an unknown API path', '/api/v1/not-a-module'],
    ['an unknown path under a public module', '/api/v1/auth/not-a-route'],
  ])('answers %s with the JSON error envelope', async (_label, path) => {
    const response = await request(createApp()).get(path);

    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.error.message).toBe('The requested endpoint does not exist.');
    expect(response.body.error.requestId).toBeTruthy();
  });

  // Modules that apply requireAuth at the router level answer 401 before route
  // matching, so an unknown path under one of them is indistinguishable from an
  // unauthenticated request. That is the safer of the two answers — it does not
  // disclose which paths exist — and it is asserted here so the catch-all above
  // is not mistaken for covering every prefix.
  it('leaves authenticated modules to answer 401 first', async () => {
    const response = await request(createApp()).get('/api/v1/children/not-a-route');

    expect(response.status).toBe(401);
  });
});

describe('API docs', () => {
  // isProduction is read when config/env.js is first evaluated, so the
  // production case needs a fresh module graph rather than a mutated flag.
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    vi.resetModules();
  });

  it('serves the docs outside production', async () => {
    process.env.NODE_ENV = 'development';
    const { createApp: create } = await import('../../app.js');

    const response = await request(create()).get('/api/docs/');

    expect(response.status).toBe(200);
  });

  it('does not serve the docs in production', async () => {
    process.env.NODE_ENV = 'production';
    const { createApp: create } = await import('../../app.js');

    const response = await request(create()).get('/api/docs/');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
