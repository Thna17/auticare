import { describe, expect, it } from 'vitest';
import { PasswordService } from './password.service.js';
describe('PasswordService', () => {
  it('hashes and verifies using argon2id', async () => {
    const service = new PasswordService();
    const hash = await service.hash('a-safe-development-password');
    expect(hash).not.toContain('a-safe-development-password');
    await expect(service.verify(hash, 'a-safe-development-password')).resolves.toBe(true);
  });
});
