"use client";

import { useState } from "react";
import { ProfileMenu } from "@/components/layout/ProfileMenu";
import { MobileNavSheet } from "@/components/layout/MobileBavSheet";
import { Menu } from "lucide-react";

interface AppTopBarProps {
  hasLiveElection?: boolean;
}

export function AppTopBar({ hasLiveElection }: AppTopBarProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <>
      <header className="flex h-[57px] items-center justify-between border-b border-sevs-border bg-sevs-surface px-4 md:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-sevs-text-secondary hover:bg-sevs-surface-hover md:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </button>

          {hasLiveElection && (
            <span className="sevs-tag hidden items-center gap-1.5 rounded-full border border-sevs-success/30 bg-sevs-success-dim px-3 py-1 text-sevs-success sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-sevs-success" />
              Election live
            </span>
          )}
        </div>

        <ProfileMenu />
      </header>

      <MobileNavSheet open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
    </>
  );
}