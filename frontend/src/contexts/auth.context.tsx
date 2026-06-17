"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { mockUsersByRole, mockCurrentUser } from "@/lib/data/users.data";
import type { AuthenticatedUser, UserRole } from "@/lib/types";

interface AuthContextValue {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  login: (user: AuthenticatedUser) => void;
  logout: () => void;
  /** Dev-only helper: swap the active mock identity by role. */
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ROLE_COOKIE = "sevs_role";

function setRoleCookie(role: UserRole | null) {
  if (typeof document === "undefined") return;
  if (role) {
    document.cookie = `${ROLE_COOKIE}=${role}; path=/; SameSite=Lax`;
  } else {
    document.cookie = `${ROLE_COOKIE}=; path=/; max-age=0`;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // MOCK: pre-seed with a default mock user for development.
  // REAL: this should start as null and be hydrated from a session
  // check (e.g. a /me request using the stored JWT) on mount.
  const [user, setUser] = useState<AuthenticatedUser | null>(mockCurrentUser);

  // Keep the middleware-readable cookie in sync with whatever user
  // is currently active, including on first mount.
  useEffect(() => {
    setRoleCookie(user?.role ?? null);
  }, [user]);

  function login(nextUser: AuthenticatedUser) {
    setUser(nextUser);
  }

  function logout() {
    setUser(null);
  }

  function switchRole(role: UserRole) {
    setUser(mockUsersByRole[role]);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};