"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { mockCurrentUser } from "@/lib/data/users.data";
import type { AuthenticatedUser } from "@/lib/types";

interface AuthContextValue {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  login: (user: AuthenticatedUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // MOCK: pre-seed with a mock user for development
  const [user, setUser] = useState<AuthenticatedUser | null>(mockCurrentUser);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login: setUser,
      logout: () => setUser(null)
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};