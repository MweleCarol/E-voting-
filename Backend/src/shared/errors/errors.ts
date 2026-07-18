/**
 * Domain-specific error subclasses for SEVS.
 *
 * Architecture pattern: Error Hierarchy / Semantic Errors
 *
 * WHY separate subclasses instead of just passing different status codes?
 *
 * 1. Readability: `throw new NotFoundError('Election not found')` is far more
 *    expressive than `throw new AppError('Election not found', 404, 'NOT_FOUND')`.
 *    Status code and error code are implementation details, not domain concepts.
 *
 * 2. Type safety: Catch blocks can narrow by type:
 *      catch (err) {
 *        if (err instanceof ElectionStateError) { ... }
 *      }
 *
 * 3. Consistency: The error code is fixed per class — you cannot accidentally
 *    throw a 404 with error code 'AUTH_FAILED'. Every error has one canonical
 *    code, defined once, used everywhere.
 *
 * 4. Discoverability: New team members see the full error vocabulary here.
 *    They don't have to grep the codebase to find all possible error codes.
 *
 * Each class imports from the error codes constants file — that file is the
 * single source of truth for all string error codes. Never hardcode a string
 * error code in a throw statement anywhere else in the codebase.
 */
import { AppError } from '@shared/errors/AppError';
import { ERROR_CODES } from '@shared/constants/error-codes.constants';
import { HTTP_STATUS } from '@shared/constants/http-status.constants';


// ---------------------------------------------------------------------------
// 400 — Validation Error
// ---------------------------------------------------------------------------
/**
 * Thrown when request data fails schema validation (Zod).
 * The validate middleware throws this automatically.
 * Optionally carries field-level errors for the frontend to display.
 */
export class ValidationError extends AppError {
  public readonly fieldErrors?: Record<string, string[]>;

  constructor(message: string = 'Validation failed', fieldErrors?: Record<string, string[]>) {
    super(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    this.fieldErrors = fieldErrors;
  }
}

// ---------------------------------------------------------------------------
// 401 — Authentication Error
// ---------------------------------------------------------------------------
/**
 * Thrown when the requester cannot be identified.
 * Used for: missing token, expired token, wrong password, invalid TOTP code.
 *
 * SECURITY NOTE: Never reveal *why* authentication failed in the message.
 * 'Invalid credentials' is correct. 'Wrong password' is an information leak —
 * it confirms the username exists and the password is the only problem.
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.AUTHENTICATION_FAILED);
  }
}

// ---------------------------------------------------------------------------
// 403 — Authorization Error
// ---------------------------------------------------------------------------
/**
 * Thrown when the requester is identified but lacks permission.
 * 401 = "Who are you?" | 403 = "I know who you are, but you can't do this."
 *
 * The distinction matters: 401 should prompt a login redirect on the frontend.
 * 403 should display an 'access denied' message — re-logging in won't help.
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.AUTHORIZATION_FAILED);
  }
}

// ---------------------------------------------------------------------------
// 404 — Not Found
// ---------------------------------------------------------------------------
/**
 * Thrown when a requested resource does not exist.
 * Be specific in the message: 'Election not found' not just 'Not found'.
 * This helps debugging without leaking sensitive information.
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
}

// ---------------------------------------------------------------------------
// 409 — Conflict Error
// ---------------------------------------------------------------------------
/**
 * Thrown when a request conflicts with current state.
 * Examples: registering a username that already exists, creating an election
 * with a name that already exists, registering a student who is already registered.
 *
 * 409 is the correct HTTP status for "this would create a duplicate".
 * Do not use 400 for conflicts — 400 means malformed request, not logical conflict.
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT);
  }
}

// ---------------------------------------------------------------------------
// 422 — Election State Error
// ---------------------------------------------------------------------------
/**
 * Thrown when an operation is attempted on an election in the wrong state.
 *
 * Example: trying to accept candidate registrations for a CLOSED election,
 * or trying to publish results for an ACTIVE election.
 *
 * WHY 422 Unprocessable Entity instead of 400?
 * 400 means the request is malformed — wrong format, missing fields.
 * 422 means the request is well-formed but semantically invalid given
 * current state. This distinction is meaningful for API clients.
 *
 * 
 * DRAFT → PENDING_APPROVAL → SCHEDULED → ACTIVE → CLOSED → RESULTS_PENDING → ARCHIVED
 * This error enforces those transitions.
 */
export class ElectionStateError extends AppError {
  constructor(message: string = 'Invalid election state for this operation') {
    super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, ERROR_CODES.INVALID_ELECTION_STATE);
  }
}

// ---------------------------------------------------------------------------
// 409 — Double Voting Error
// ---------------------------------------------------------------------------
/**
 * Thrown when a voter attempts to vote more than once in an election.
 *
 * This is a specialised ConflictError because double voting is the most
 * critical integrity violation in the system. Giving it its own class means:
 * 1. The audit log can identify it precisely by error type
 * 2. The security logger can fire a specific alert
 * 3. Future rate-limiting logic can target this class specifically
 *
 * The error code DOUBLE_VOTING_ATTEMPT is logged with HIGH severity.
 */
export class DoubleVotingError extends AppError {
  constructor(message: string = 'Voter has already participated in this election') {
    super(message, HTTP_STATUS.CONFLICT, ERROR_CODES.DOUBLE_VOTING_ATTEMPT);
  }
}

// ---------------------------------------------------------------------------
// 500 — Cryptographic Error
// ---------------------------------------------------------------------------
/**
 * Thrown when a cryptographic operation fails.
 * Examples: decryption failure (wrong key or tampered data), signature
 * verification failure, invalid IV length.
 *
 * WHY 500 instead of 400?
 * Cryptographic failures in SEVS are not the client's fault — the client
 * submitted a valid vote. If crypto fails, it is either:
 *   a) A server configuration problem (wrong key)
 *   b) Data tampering (tampered ciphertext)
 * Both are server-side concerns. 500 is correct.
 *
 * NOTE: isOperational = false here — a crypto failure is an abnormal event
 * that should trigger investigation, not be silently swallowed.
 */
export class CryptographicError extends AppError {
  constructor(message: string = 'Cryptographic operation failed') {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.CRYPTOGRAPHIC_ERROR, false);
  }
}



// ---------------------------------------------------------------------------
// 403 — Forbidden Error (resource-level, not role-level)
// ---------------------------------------------------------------------------
/**
 * Thrown when an authenticated user holds a role that legitimately permits
 * this ROUTE, but they are attempting to act on a specific RESOURCE they do
 * not own or are not scoped to.
 *
 * Distinct from AuthorizationError, which fires when the role itself never
 * permits the action — this fires when the role permits it in general, but
 * not for this particular row.
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'You do not have access to this resource') {
    super(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
  }
}



// ---------------------------------------------------------------------------
// 501 — Not Implemented Error
// ---------------------------------------------------------------------------
/**
 * Thrown when a request is well-formed and reaches a code path that is
 * intentionally unbuilt — not a client error, not a data error, a genuine
 * "this handler does not exist yet" server condition.
 *
 * SEVS-specific case: an ApprovalRequest of an actionType (e.g.
 * CANDIDATE_APPROVE, RESULTS_PUBLISH) reaches quorum resolution inside the
 * Approvals module before the module that owns that action type (M10, M14)
 * has registered a resolver. This should be structurally unreachable in
 * production — those request rows can currently only be created by a direct
 * DB insert, not through any real code path — so if it fires, it means the
 * system is in a state that shouldn't exist, not that the user did anything
 * wrong.
 *
 * isOperational = false: like CryptographicError, this warrants investigation
 * rather than being treated as a routine, expected failure.
 */
export class NotImplementedError extends AppError {
  constructor(message: string = 'This operation is not yet implemented') {
    super(message, HTTP_STATUS.NOT_IMPLEMENTED, ERROR_CODES.NOT_IMPLEMENTED, false);
  }
}


/**
 * Thrown when a ballot token doesn't correspond to any issued Ballot.
 * Distinct from a generic NotFoundError because the frontend needs to
 * react differently — "request a ballot" is a different call to action
 * than a generic 404.
 */
export class BallotNotFoundError extends AppError {
  constructor(message: string = 'Ballot token not found') {
    super(message, HTTP_STATUS.NOT_FOUND, ERROR_CODES.BALLOT_NOT_FOUND);
  }
}


/**
 * Thrown when a ballot token existed and was valid, but its session
 * window has passed. 410 Gone, not 404 — the resource is confirmed to
 * have once existed and be legitimately gone, which is a meaningfully
 * different signal from "never existed" to a client deciding whether
 * to prompt a retry (410) versus treat the request as malformed (404).
 */
export class BallotExpiredError extends AppError {
  constructor(message: string = 'This ballot has expired') {
    super(message, HTTP_STATUS.GONE, ERROR_CODES.BALLOT_EXPIRED);
  }
}

export class CandidateNotApprovedError extends AppError {
  constructor(message: string = 'Candidate is not approved for this position') {
    super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, ERROR_CODES.CANDIDATE_NOT_APPROVED);
  }
}