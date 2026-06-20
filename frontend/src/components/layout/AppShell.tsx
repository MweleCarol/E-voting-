"use client";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppTopBar } from "@/components/layout/AppTopBar";
import { useElections } from "@/lib/hooks/use-dashboard-data";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: elections } = useElections();
  const hasLiveElection = (elections ?? []).some((e) => e.status === "ACTIVE");

  return (
    <div className="flex min-h-screen bg-sevs-bg">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopBar hasLiveElection={hasLiveElection} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}