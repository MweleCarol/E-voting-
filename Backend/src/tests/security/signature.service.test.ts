import { signVoteCiphertext, verifyVoteSignature } from '@security/signature.service';

describe('signature.service', () => {
  it('verifies a signature against its original ciphertext', () => {
    const sig = signVoteCiphertext('some-ciphertext');
    expect(verifyVoteSignature('some-ciphertext', sig)).toBe(true);
  });

  it('rejects a signature if the ciphertext was altered', () => {
    const sig = signVoteCiphertext('some-ciphertext');
    expect(verifyVoteSignature('some-ciphertext-ALTERED', sig)).toBe(false);
  });
});