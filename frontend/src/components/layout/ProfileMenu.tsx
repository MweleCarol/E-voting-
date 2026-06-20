"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth.context";
import { useTheme } from "@/lib/theme/theme-provider";
import { Settings, LogOut, Moon, Sun } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  STUDENT: "Student",
  CANDIDATE: "Candidate",
  ELECTION_OFFICER: "Election Officer",
  VERIFICATION_OFFICER: "Verification Officer",
  AUDITOR: "Auditor",
  OBSERVER: "Observer",
  SYSTEM_ADMIN: "System Admin",
};

export function ProfileMenu() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (!user) return null;

  const displayName = user.student?.fullName ?? user.email;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full border border-sevs-border bg-sevs-surface-raised font-mono text-sm font-medium text-sevs-text-primary transition-colors hover:bg-sevs-surface-hover"
          aria-label="Open profile menu"
        >
          {initial}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 border-sevs-border bg-sevs-surface">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-sevs-text-primary truncate">{displayName}</span>
          <span className="sevs-tag text-sevs-text-muted">{ROLE_LABELS[user.role] ?? user.role}</span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-sevs-border" />

        <DropdownMenuItem onClick={toggleTheme} className="text-sevs-text-secondary focus:bg-sevs-surface-hover focus:text-sevs-text-primary">
          {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </DropdownMenuItem>

        <DropdownMenuItem disabled className="text-sevs-text-secondary focus:bg-sevs-surface-hover focus:text-sevs-text-primary">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-sevs-border" />

        <DropdownMenuItem onClick={logout} className="text-sevs-danger focus:bg-sevs-danger-dim focus:text-sevs-danger">
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}