"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  /**
   * "routine" — everyday confirmations (delete a draft, discard changes).
   * "irreversible" — actions with no undo path: casting a vote, publishing
   * results, closing an election. Renders with a warning icon, danger-toned
   * confirm button, and a typed-confirmation safeguard.
   */
  variant?: "routine" | "irreversible";
  /**
   * Required for "irreversible" variant. The voter/officer must type this
   * exact phrase before the confirm button activates — this is the
   * deliberate-friction pattern for actions that can't be undone.
   */
  typedConfirmationPhrase?: string;
}

export function ConfirmationModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  variant = "routine",
  typedConfirmationPhrase,
}: ConfirmationModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [typedValue, setTypedValue] = useState("");

  const isIrreversible = variant === "irreversible";
  const requiresTypedConfirmation = isIrreversible && !!typedConfirmationPhrase;
  const canConfirm = !requiresTypedConfirmation || typedValue === typedConfirmationPhrase;

  async function handleConfirm() {
    setIsConfirming(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setIsConfirming(false);
      setTypedValue("");
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) setTypedValue("");
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={cn(isIrreversible && "border-sevs-danger/30")}>
        <DialogHeader>
          {isIrreversible && (
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-sevs-danger-light">
              <AlertTriangle className="h-5 w-5 text-sevs-danger" aria-hidden />
            </div>
          )}
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {requiresTypedConfirmation && (
          <div className="space-y-2 py-2">
            <label htmlFor="confirm-phrase" className="text-sm font-medium text-sevs-text-secondary">
              Type <span className="font-mono text-sevs-text-primary">{typedConfirmationPhrase}</span> to continue
            </label>
            <input
              id="confirm-phrase"
              type="text"
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              autoComplete="off"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sevs-danger/30"
            />
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isConfirming}
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm || isConfirming}
            className={cn(
              isIrreversible
                ? "bg-sevs-danger text-white hover:bg-sevs-danger/90"
                : "bg-sevs-primary text-white hover:bg-sevs-primary-light"
            )}
          >
            {isConfirming ? "Working…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}