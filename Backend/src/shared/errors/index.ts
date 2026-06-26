/**
 * Errors barrel export.
 * Import all error types from '@shared/errors', not from individual files.
 */
export { AppError, isAppError } from './AppError';
export {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  ElectionStateError,
  DoubleVotingError,
  CryptographicError,
  ForbiddenError,
} from './errors';
