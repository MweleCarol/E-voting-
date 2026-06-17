import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, backHref, action, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-6 space-y-1", className)}>
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-sevs-text-secondary hover:text-sevs-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </Link>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-sevs-text-primary">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-sevs-text-secondary">{description}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}