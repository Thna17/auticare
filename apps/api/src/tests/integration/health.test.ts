import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
describe('health', () => {
  it('returns liveness envelope', async () => {
    const response = await request(createApp()).get('/health/live');
    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('live');
  });
});
