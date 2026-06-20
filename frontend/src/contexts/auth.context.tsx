"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { mockUsersByRole, mockCurrentUser } from "@/lib/data/users.data";
import type { AuthenticatedUser, UserRole } from "@/lib/types";

interface AuthContextValue {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  login: (user: AuthenticatedUser) => void;
  logout: () => void;
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
  const [user, setUser] = useState<AuthenticatedUser | null>(mockCurrentUser);

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
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};