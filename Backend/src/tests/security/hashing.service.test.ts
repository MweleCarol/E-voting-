import {
  sha256,
  canonicalStringify,
  computeChainHash,
  generateSalt,
  timingSafeHexEqual,
} from '@security/hashing.service';

describe('hashing.service', () => {
  describe('sha256', () => {
    it('is deterministic for the same input', () => {
      expect(sha256('hello')).toBe(sha256('hello'));
    });

    it('produces different output for different input', () => {
      expect(sha256('hello')).not.toBe(sha256('hello!'));
    });

    it('produces a 64-character hex string', () => {
      expect(sha256('hello')).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('canonicalStringify', () => {
    it('is identical regardless of key insertion order', () => {
      expect(canonicalStringify({ b: 1, a: 2 })).toBe(canonicalStringify({ a: 2, b: 1 }));
    });

    it('canonicalizes nested objects too', () => {
      const a = canonicalStringify({ outer: { z: 1, y: 2 } });
      const b = canonicalStringify({ outer: { y: 2, z: 1 } });
      expect(a).toBe(b);
    });
  });

  describe('computeChainHash', () => {
    it('changes when previousHash changes — proves the chain actually chains', () => {
      const event = { action: 'LOGIN', userId: 'u1' };
      const hashA = computeChainHash(event, 'genesis');
      const hashB = computeChainHash(event, hashA);
      expect(hashA).not.toBe(hashB);
    });

    it('is deterministic for identical inputs', () => {
      const event = { action: 'LOGIN', userId: 'u1' };
      expect(computeChainHash(event, 'genesis')).toBe(computeChainHash(event, 'genesis'));
    });
  });

  describe('generateSalt', () => {
    it('produces hex output of the requested byte length', () => {
      expect(generateSalt(16)).toMatch(/^[0-9a-f]{32}$/); // 16 bytes → 32 hex chars
    });

    it('produces a different value on every call', () => {
      expect(generateSalt()).not.toBe(generateSalt());
    });
  });

  describe('timingSafeHexEqual', () => {
    it('returns true for identical hex strings', () => {
      const hash = sha256('some-value');
      expect(timingSafeHexEqual(hash, hash)).toBe(true);
    });

    it('returns false for different hex strings of equal length', () => {
      expect(timingSafeHexEqual(sha256('a'), sha256('b'))).toBe(false);
    });

    it('returns false — not throw — when lengths differ', () => {
      expect(timingSafeHexEqual('ab', 'abcd')).toBe(false);
    });
  });
});