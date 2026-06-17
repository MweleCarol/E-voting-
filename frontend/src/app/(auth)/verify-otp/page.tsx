"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/shared/ToastNotification";
import { authService } from "@/lib/services/auth.service";
import { useAuth } from "@/contexts/auth.context";
import { Mail } from "lucide-react";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const email = searchParams.get("email") ?? "";

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function handleChange(index: number, value: string) {
    const digit = value.replace(/[^0-9]/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((char, i) => (next[i] = char));
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  }

  async function handleVerify() {
    const code = digits.join("");
    if (code.length !== OTP_LENGTH) {
      notify.error("Enter the full 6-digit code.");
      return;
    }

    setIsVerifying(true);
    try {
      const user = await authService.verifyOtp(email, code);
      login(user);
      notify.success("Signed in");
      router.push("/dashboard");
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Verification failed.");
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    notify.info("A new code has been sent.");
    // REAL: call authService.resendOtp(email) here
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-sevs-surface-raised px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sevs-primary-muted">
            <Mail className="h-6 w-6 text-sevs-primary" aria-hidden />
          </div>
          <h1 className="font-display text-xl font-semibold text-sevs-text-primary">
            Check your email
          </h1>
          <p className="mt-1 text-sm text-sevs-text-secondary">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-sevs-text-primary">{email || "your email"}</span>
          </p>
        </div>

        <div className="rounded-xl border border-sevs-border bg-sevs-surface p-6 shadow-sm">
          <div className="flex justify-between gap-2">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="h-12 w-10 rounded-md border border-input bg-background text-center font-mono text-lg focus:outline-none focus:ring-2 focus:ring-sevs-primary/30"
              />
            ))}
          </div>

          <Button
            onClick={handleVerify}
            disabled={isVerifying}
            className="mt-6 w-full bg-sevs-primary text-white hover:bg-sevs-primary-light"
          >
            {isVerifying ? "Verifying…" : "Verify and continue"}
          </Button>

          <button
            onClick={handleResend}
            disabled={cooldown > 0}
            className="mt-3 w-full text-center text-sm text-sevs-text-secondary hover:text-sevs-primary disabled:text-sevs-text-muted disabled:hover:text-sevs-text-muted transition-colors"
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-sevs-text-muted">
          Development code: <span className="font-mono">123456</span>
        </p>
      </div>
    </main>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={null}>
      <VerifyOtpForm />
    </Suspense>
  );
}