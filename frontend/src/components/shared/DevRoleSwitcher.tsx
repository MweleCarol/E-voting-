"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth.context";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ShieldCheck, X } from "lucide-react";

// Renders ONLY in development. Lets you swap the active mock identity
// without going through login/OTP, so every role-gated screen can be
// checked in seconds. Remove or guard this more strictly before any
// real deployment — it bypasses auth entirely by design.

const ROLE_LABELS: Record<UserRole, string> = {
  STUDENT: "Student",
  CANDIDATE: "Candidate",
  ELECTION_OFFICER: "Election Officer",
  VERIFICATION_OFFICER: "Verification Officer",
  AUDITOR: "Auditor",
  OBSERVER: "Observer",
  SYSTEM_ADMIN: "System Admin",
};

export function DevRoleSwitcher() {
  const { user, switchRole } = useAuth();
  const [open, setOpen] = useState(false);

  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-2 w-56 rounded-lg border border-sevs-border bg-sevs-surface p-2 shadow-lg">
          <p className="px-2 pb-1.5 text-xs font-medium uppercase tracking-wide text-sevs-text-muted">
            Dev: switch role
          </p>
          <div className="space-y-0.5">
            {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
              <button
                key={role}
                onClick={() => switchRole(role)}
                className={cn(
                  "w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                  user?.role === role
                    ? "bg-sevs-primary-muted text-sevs-primary font-medium"
                    : "text-sevs-text-secondary hover:bg-muted"
                )}
              >
                {ROLE_LABELS[role]}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-sevs-primary text-white shadow-lg hover:bg-sevs-primary-light transition-colors"
        aria-label="Toggle dev role switcher"
      >
        {open ? <X className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
      </button>
    </div>
  );
}