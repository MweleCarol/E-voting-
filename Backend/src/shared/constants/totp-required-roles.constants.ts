import type { RoleName } from '@shared/types/role.types';

/**
 * Roles that MUST complete TOTP enrollment before being treated as
 * fully authenticated. Enforced at two independent points:
 *
 * 1. verifyStaffActivation — activation for these roles returns
 *    TOTP_SETUP_REQUIRED instead of issuing a full session directly,
 *    forcing enrollment immediately after first password set.
 *
 * 2. login() — a belt-and-suspenders check: if a mandatory-TOTP role
 *    somehow reaches ACTIVE without a verified secret (a bug, a manual
 *    DB edit, a future code path that forgets this rule), login blocks
 *    them with the same TOTP_SETUP_REQUIRED result rather than silently
 *    granting a full session with no MFA at all.
 *
 * OBSERVER is excluded deliberately: read-only, no write surface,
 * individually lower risk than roles that can approve or audit.
 */
export const TOTP_REQUIRED_ROLES: ReadonlySet<RoleName> = new Set([
  'SYSTEM_ADMIN',
  'ELECTION_OFFICER',
  'VERIFICATION_OFFICER',
  'AUDITOR',
]);