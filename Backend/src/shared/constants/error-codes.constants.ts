/**
 * Application Error Codes — Single Source of Truth
 *
 * Every error code string in our system is defined here exactly once.
 * Error subclasses import from here. The global error handler imports from here.
 * The frontend can use these strings to display localised error messages.
 *
 * Convention: SCREAMING_SNAKE_CASE, domain-prefixed where appropriate.
 *
 * WHY a constants file instead of an enum?
 * TypeScript enums compile to objects with reverse mappings, which adds
 * unnecessary overhead. `as const` objects give you the same type safety
 * (literal types, autocomplete, exhaustiveness checking) without the bloat.
 * This is the community-preferred pattern in modern TypeScript.
 */
export const ERROR_CODES = {
  // --- Generic ---
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',

  // --- Authentication & Authorization ---
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  AUTHORIZATION_FAILED: 'AUTHORIZATION_FAILED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  TOKEN_REVOKED: 'TOKEN_REVOKED',
  TOTP_REQUIRED: 'TOTP_REQUIRED',
  TOTP_INVALID: 'TOTP_INVALID',
  TOTP_ALREADY_ENABLED: 'TOTP_ALREADY_ENABLED',

  // --- Rate Limiting ---
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // --- Users ---
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_SUSPENDED: 'USER_SUSPENDED',
  USER_INACTIVE: 'USER_INACTIVE',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',

  // --- Students ---
  STUDENT_NOT_FOUND: 'STUDENT_NOT_FOUND',
  STUDENT_ALREADY_REGISTERED: 'STUDENT_ALREADY_REGISTERED',
  STUDENT_NOT_VERIFIED: 'STUDENT_NOT_VERIFIED',

  // --- Elections ---
  ELECTION_NOT_FOUND: 'ELECTION_NOT_FOUND',
  INVALID_ELECTION_STATE: 'INVALID_ELECTION_STATE',
  ELECTION_NOT_ACTIVE: 'ELECTION_NOT_ACTIVE',

  // --- Candidates ---
  CANDIDATE_NOT_FOUND: 'CANDIDATE_NOT_FOUND',
  CANDIDATE_NOT_APPROVED: 'CANDIDATE_NOT_APPROVED',
  ALREADY_A_CANDIDATE: 'ALREADY_A_CANDIDATE',

  // --- Voting ---
  VOTER_NOT_REGISTERED: 'VOTER_NOT_REGISTERED',
  DOUBLE_VOTING_ATTEMPT: 'DOUBLE_VOTING_ATTEMPT',
  BALLOT_NOT_FOUND: 'BALLOT_NOT_FOUND',
  BALLOT_EXPIRED: 'BALLOT_EXPIRED',
  BALLOT_ALREADY_USED: 'BALLOT_ALREADY_USED',

  // --- Approvals ---
  APPROVAL_NOT_FOUND: 'APPROVAL_NOT_FOUND',
  APPROVAL_ALREADY_SUBMITTED: 'APPROVAL_ALREADY_SUBMITTED',
  INSUFFICIENT_APPROVALS: 'INSUFFICIENT_APPROVALS',

  // --- Cryptography ---
  CRYPTOGRAPHIC_ERROR: 'CRYPTOGRAPHIC_ERROR',
  SIGNATURE_VERIFICATION_FAILED: 'SIGNATURE_VERIFICATION_FAILED',
  ENCRYPTION_FAILED: 'ENCRYPTION_FAILED',
  DECRYPTION_FAILED: 'DECRYPTION_FAILED',

  // --- Audit ---
  AUDIT_CHAIN_BROKEN: 'AUDIT_CHAIN_BROKEN',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
