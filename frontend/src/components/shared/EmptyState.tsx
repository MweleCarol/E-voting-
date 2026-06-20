import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-sevs-border px-6 py-12 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sevs-accent-dim/15">
        <Icon className="h-6 w-6 text-sevs-accent" aria-hidden />
      </div>
      <h3 className="font-display text-base font-semibold text-sevs-text-primary">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-sevs-text-secondary">{description}</p>
      {action && (
        <Button onClick={action.onClick} className="mt-4 bg-sevs-accent text-sevs-bg hover:bg-sevs-accent/90">
          {action.label}
        </Button>
      )}
    </div>
  );
}