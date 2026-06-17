"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/shared/ToastNotification";
import { authService } from "@/lib/services/auth.service";
import { ShieldCheck } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Enter a valid university email"),
  password: z.string().min(1, "Enter your password"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginFormValues) {
    setIsSubmitting(true);
    try {
      const { pendingEmail } = await authService.login(values);
      // Pass the email forward via query param so the OTP screen knows
      // who it's verifying. REAL: this would instead be a short-lived
      // session id returned by the login endpoint, not a raw email.
      router.push(`/verify-otp?email=${encodeURIComponent(pendingEmail)}`);
    } catch {
      notify.error("Couldn't sign in. Check your details and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-sevs-surface-raised px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sevs-primary-muted">
            <ShieldCheck className="h-6 w-6 text-sevs-primary" aria-hidden />
          </div>
          <h1 className="font-display text-xl font-semibold text-sevs-text-primary">
            Sign in to SEVS
          </h1>
          <p className="mt-1 text-sm text-sevs-text-secondary">
            Dedan Kimathi University of Technology
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-sevs-border bg-sevs-surface p-6 shadow-sm">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-sevs-text-primary">
              University email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="your.name@dkut.ac.ke"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sevs-primary/30"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-sevs-danger">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-sevs-text-primary">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sevs-primary/30"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-sevs-danger">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-sevs-primary text-white hover:bg-sevs-primary-light"
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-sevs-text-muted">
          Accounts are provisioned by your election administrator.
        </p>
      </div>
    </main>
  );
}