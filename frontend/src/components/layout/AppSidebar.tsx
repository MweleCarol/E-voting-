"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavSectionsForRole } from "@/lib/constants/navigation";
import { useAuth } from "@/contexts/auth.context";
import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const sections = getNavSectionsForRole(user.role);

  return (
    <aside className="hidden w-60 flex-shrink-0 flex-col border-r border-sevs-border bg-sevs-surface md:flex">
      <div className="flex h-[57px] items-center gap-2 border-b border-sevs-border px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sevs-accent-dim/20">
          <ShieldCheck className="h-4 w-4 text-sevs-accent" />
        </div>
        <span className="font-display font-semibold text-sevs-text-primary">SEVS</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="sevs-tag mb-2 px-2 text-sevs-text-muted">{section.label}</p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-sevs-accent-dim/15 text-sevs-accent font-medium"
                        : "text-sevs-text-secondary hover:bg-sevs-surface-hover hover:text-sevs-text-primary"
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}