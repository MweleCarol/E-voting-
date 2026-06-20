import { Clock, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VoterRegistration } from "@/lib/types";

interface VoterStatusBannerProps {
  registration: VoterRegistration | null;
}

export function VoterStatusBanner({ registration }: VoterStatusBannerProps) {
  if (!registration) return null;
  if (registration.status === "VERIFIED") return null;

  const isPending = registration.status === "PENDING";

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm",
        isPending
          ? "border-sevs-warning/30 bg-sevs-warning-dim text-sevs-warning"
          : "border-sevs-danger/30 bg-sevs-danger-dim text-sevs-danger"
      )}
    >
      {isPending ? (
        <Clock className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden />
      ) : (
        <ShieldAlert className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden />
      )}
      <p>
        {isPending
          ? "Your voter registration is pending verification. You'll be able to vote once a verification officer confirms your eligibility."
          : "Your voter registration was not approved. Contact your verification officer for details."}
      </p>
    </div>
  );
}