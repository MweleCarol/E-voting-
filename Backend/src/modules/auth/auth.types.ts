/**
 * Every JWT this system issues declares what it's FOR. This single
 * union is the foundation of the entire two-step login design — it's
 * what lets authenticate.middleware.ts categorically reject an
 * mfa_pending token on a protected route, and what would let you
 * reject a refresh token if someone tried presenting it as an access
 * token instead of using it on /auth/refresh. A token without a
 * declared purpose is a token any code path might misuse by accident.
 */
export type TokenPurpose = 'access' | 'mfa_pending';

export interface AccessTokenPayload {
  purpose: 'access';
  userId: string;
  roleId: string;
}

export interface RefreshTokenPayload {
  purpose: 'refresh';
  userId: string;
  /** tokenId ties this JWT to its row in the RefreshToken table —
   * this is what makes server-side revocation possible at all. A
   * stateless JWT alone can't be revoked before it expires; this ID
   * is what auth.repository.ts looks up to check "has this been
   * revoked?" on every refresh attempt. */
  tokenId: string;
}

export interface MfaPendingTokenPayload {
  purpose: 'mfa_pending';
  userId: string;
}

/** Discriminated union over the `purpose` field. TypeScript will
 * narrow this automatically once you check `.purpose` in a
 * conditional — this is the same pattern as the AppError hierarchy
 * from M3: one shared shape, narrowed by a literal discriminant. */
export type JwtPayload = AccessTokenPayload | MfaPendingTokenPayload;

// ---------------------------------------------------------------------
// Activation
// ---------------------------------------------------------------------

export interface ActivationInitiateInput {
  admissionNumber: string;
  schoolEmail: string;
}

export interface ActivationVerifyInput {
  admissionNumber: string;
  otp: string;
  password: string;
}

// ---------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------

export interface LoginInput {
  identifier: string; // email OR admission number
  password: string;
}

/**
 * The discriminated return shape for the login service call. This is
 * the type-level enforcement of the two-step flow we designed: the
 * controller CANNOT accidentally read `.accessToken` off a result
 * that's actually the MFA-required branch — TypeScript won't let it
 * compile. Compare this to returning one loosely-shaped object with
 * optional fields on both branches; that approach would let a typo
 * silently read `undefined` instead of failing to compile.
 */
export interface TotpLoginInput {
  mfaToken: string;
  code: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ---------------------------------------------------------------------
// Session lifecycle
// ---------------------------------------------------------------------

export interface RefreshInput {
  refreshToken: string;
}

export interface LogoutInput {
  refreshToken: string;
}

// ---------------------------------------------------------------------
// TOTP enrollment
// ---------------------------------------------------------------------

export interface TotpSetupResult {
  /** otpauth:// URI — what gets encoded into the QR code the frontend renders */
  otpAuthUrl: string;
}

export interface TotpConfirmInput {
  code: string;
}

// ---------------------------------------------------------------------
// What gets attached to req.user by authenticate.middleware.ts
// ---------------------------------------------------------------------

/**
 * Deliberately NOT the raw Prisma User type. Controllers and
 * downstream middleware should depend on this small, stable shape —
 * not on every column the User table happens to have. If M6 adds five
 * new profile fields to User, nothing in the auth middleware or any
 * protected route should need to change because of it.
 */
export interface AuthenticatedUser {
  userId: string;
  roleId: string;
}




export interface StaffActivationInitiateInput {
  email: string;
}

export interface StaffActivationVerifyInput {
  email: string;
  otp: string;
  password: string;
}

/**
 * Discriminated union — same pattern as LoginResult.
 * TOTP_SETUP_REQUIRED means: account is now ACTIVE, password set,
 * but this role mandates TOTP. The access token is real and scoped
 * to let the client immediately call /auth/totp/setup and /auth/totp/confirm.
 * After confirm, the next login will issue a full session normally.
 */
export type StaffActivationVerifyResult =
  | { status: 'ACTIVATED'; tokens: TokenPair }
  | { status: 'TOTP_SETUP_REQUIRED'; accessToken: string };

// Extend LoginResult — add the third branch
// Replace the existing LoginResult type with:
export type LoginResult =
  | { status: 'AUTHENTICATED'; tokens: TokenPair }
  | { status: 'MFA_REQUIRED'; mfaToken: string }
  | { status: 'TOTP_SETUP_REQUIRED'; accessToken: string };