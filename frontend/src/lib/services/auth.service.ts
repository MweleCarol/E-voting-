import { mockUsersByRole } from "@/lib/data/users.data";
import type { AuthenticatedUser } from "@/lib/types";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResult {
  // In the real flow this would be a temp session/token used to verify
  // OTP against; mocked here as the email since we have no backend yet.
  pendingEmail: string;
}

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResult> {
    // MOCK: accept any credentials, simulate latency, return pending state
    // REAL: POST /api/auth/login → { otpSessionId } or similar
    await new Promise((r) => setTimeout(r, 500));
    return { pendingEmail: payload.email };
  },

  async verifyOtp(email: string, otp: string): Promise<AuthenticatedUser> {
    // MOCK: accept "123456" as the universally valid OTP for dev.
    // REAL: POST /api/auth/verify-otp → { user, accessToken, refreshToken }
    await new Promise((r) => setTimeout(r, 500));

    if (otp !== "123456") {
      throw new Error("Invalid or expired code. Try 123456 in development.");
    }

    // MOCK: match against the seeded student account regardless of the
    // email typed, since we don't have a real user table yet.
    return mockUsersByRole.STUDENT;
  },

  async logout(): Promise<void> {
    // REAL: POST /api/auth/logout → invalidate refresh token server-side
    await new Promise((r) => setTimeout(r, 200));
  },
};