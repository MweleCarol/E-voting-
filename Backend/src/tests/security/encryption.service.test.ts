// src/tests/security/encryption.service.test.ts
import { encryptVote, decryptVote } from '@security/encryption.service';

describe('encryption.service', () => {
  it('round-trips plaintext through encrypt/decrypt', () => {
    const payload = encryptVote(JSON.stringify({ positionId: 'p1', candidateId: 'c1' }));
    expect(decryptVote(payload)).toBe(JSON.stringify({ positionId: 'p1', candidateId: 'c1' }));
  });

  it('rejects a tampered ciphertext', () => {
    const payload = encryptVote('test-vote');
    const tampered = { ...payload, encryptedVote: payload.encryptedVote.slice(0, -2) + 'AA' };
    expect(() => decryptVote(tampered)).toThrow();
  });
});