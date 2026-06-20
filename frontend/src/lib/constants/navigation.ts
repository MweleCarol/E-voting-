import type { UserRole } from "@/lib/types";
import {
  LayoutDashboard,
  Vote,
  History,
  Megaphone,
  Users,
  CheckSquare,
  ShieldCheck,
  ScrollText,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Voting",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["STUDENT", "CANDIDATE"] },
      { label: "Active election", href: "/elections", icon: Vote, roles: ["STUDENT", "CANDIDATE"] },
      { label: "Voting history", href: "/history", icon: History, roles: ["STUDENT", "CANDIDATE"] },
    ],
  },
  {
    label: "Elections",
    items: [
      { label: "Elections", href: "/admin/elections", icon: Megaphone, roles: ["ELECTION_OFFICER", "SYSTEM_ADMIN"] },
      { label: "Candidates", href: "/admin/candidates", icon: Users, roles: ["ELECTION_OFFICER", "SYSTEM_ADMIN"] },
      { label: "Verification", href: "/admin/verification", icon: ShieldCheck, roles: ["VERIFICATION_OFFICER", "SYSTEM_ADMIN"] },
      { label: "Approvals", href: "/admin/approvals", icon: CheckSquare, roles: ["ELECTION_OFFICER", "VERIFICATION_OFFICER", "SYSTEM_ADMIN"] },
    ],
  },
  {
    label: "Integrity",
    items: [
      { label: "Audit log", href: "/admin/audit", icon: ScrollText, roles: ["AUDITOR", "OBSERVER", "SYSTEM_ADMIN"] },
      { label: "Results", href: "/admin/results", icon: BarChart3, roles: ["AUDITOR", "OBSERVER", "ELECTION_OFFICER", "SYSTEM_ADMIN"] },
    ],
  },
];

export function getNavSectionsForRole(role: UserRole): NavSection[] {
  return NAV_SECTIONS
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0);
}