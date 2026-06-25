import { generateVoteReceipt, verifyVoteReceipt } from '@security/receipt.service';

describe('receipt.service', () => {
  it('verifies a receipt against its original inputs', () => {
    const receipt = generateVoteReceipt('vote-123');
    expect(
      verifyVoteReceipt('vote-123', receipt.issuedAt, receipt.salt, receipt.receiptCode),
    ).toBe(true);
  });

  it('rejects a tampered receipt code', () => {
    const receipt = generateVoteReceipt('vote-123');
    const tampered = receipt.receiptCode.slice(0, -2) + 'ff';
    expect(
      verifyVoteReceipt('vote-123', receipt.issuedAt, receipt.salt, tampered),
    ).toBe(false);
  });

  it('rejects verification against a different vote id', () => {
    const receipt = generateVoteReceipt('vote-123');
    expect(
      verifyVoteReceipt('vote-456', receipt.issuedAt, receipt.salt, receipt.receiptCode),
    ).toBe(false);
  });
});