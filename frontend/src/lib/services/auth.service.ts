import { mockUsersByRole } from "@/lib/data/users.data";
import type { AuthenticatedUser } from "@/lib/types";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResult {
  pendingEmail: string;
}

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResult> {
    await new Promise((r) => setTimeout(r, 500));
    return { pendingEmail: payload.email };
  },

  async verifyOtp(email: string, otp: string): Promise<AuthenticatedUser> {
    await new Promise((r) => setTimeout(r, 500));

    if (otp !== "123456") {
      throw new Error("Invalid or expired code. Try 123456 in development.");
    }

    return mockUsersByRole.STUDENT;
  },

  async logout(): Promise<void> {
    await new Promise((r) => setTimeout(r, 200));
  },
};