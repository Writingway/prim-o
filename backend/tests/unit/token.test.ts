import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  hashRefreshToken,
} from '../../src/lib/token';

describe('signAccessToken / verifyAccessToken', () => {
  it('roundtrip : sub, role et companyId restitués', () => {
    const token = signAccessToken('user-1', 'MANAGER', 'company-1');
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe('user-1');
    expect(payload.role).toBe('MANAGER');
    expect(payload.companyId).toBe('company-1');
  });

  it('utilisateur flottant : role null, pas de companyId', () => {
    const token = signAccessToken('user-2', null);
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe('user-2');
    expect(payload.role).toBeNull();
    expect(payload.companyId).toBeUndefined();
  });

  it('rejette un token altéré', () => {
    const token = signAccessToken('user-3', 'EMPLOYEE');
    const tampered = token.slice(0, -2) + 'ab';
    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  it('rejette un token signé avec un autre secret', () => {
    // Valid header/payload but signature from a different key.
    const forged = jwt.sign({ role: 'ADMIN' }, 'wrong-secret-wrong-secret-wrong!', {
      subject: 'user-4',
      expiresIn: '15m',
    });
    expect(() => verifyAccessToken(forged)).toThrow();
  });
});

describe('hashRefreshToken', () => {
  it('sha256 hex déterministe', () => {
    const raw = 'abc';
    const expected = crypto.createHash('sha256').update(raw).digest('hex');
    expect(hashRefreshToken(raw)).toBe(expected);
    expect(hashRefreshToken(raw)).toBe(hashRefreshToken(raw));
  });
});

describe.each([
  ['generateRefreshToken', generateRefreshToken],
  ['generateEmailVerificationToken', generateEmailVerificationToken],
  ['generatePasswordResetToken', generatePasswordResetToken],
])('%s', (_name, generate) => {
  it('raw 64 hex, hash cohérent, jamais identique', () => {
    const { raw, hash } = generate();
    expect(raw).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toBe(hashRefreshToken(raw));
    expect(generate().raw).not.toBe(raw);
  });
});
