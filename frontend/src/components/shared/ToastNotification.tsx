import { toast } from "sonner";

// Thin, typed wrapper around Sonner. The point isn't to hide the library —
// it's to stop every call site from inventing its own copy style. Keep
// messages in active voice, matching the action's own verb: a button that
// says "Cast vote" should produce "Vote cast", not "Success!" or "Submitted".

export const notify = {
  success(message: string) {
    toast.success(message);
  },
  error(message: string) {
    toast.error(message);
  },
  info(message: string) {
    toast(message);
  },
  // Use for actions that triggered a background process the user should
  // know is pending (e.g. an approval request was sent to other officers).
  pending(message: string) {
    toast(message, {
      style: { borderColor: "var(--sevs-warning)" },
    });
  },
};

// Add <Toaster /> from "sonner" once in your root layout:
//
//   import { Toaster } from "sonner";
//   ...
//   <body>
//     {children}
//     <Toaster position="top-right" richColors />
//   </body>