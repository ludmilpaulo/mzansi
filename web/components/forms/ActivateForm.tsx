"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { getErrorMessage, getFieldError } from "@/lib/errors";
import { useActivateAccountMutation, useResendActivationMutation } from "@/store/api";

const schema = z
  .object({
    email: z.string().email("Enter the email used for booking"),
    token: z.string().min(20, "Activation token is required"),
    password: z.string().min(10, "Password must be at least 10 characters"),
    password_confirm: z.string().min(10, "Confirm your password"),
  })
  .refine((values) => values.password === values.password_confirm, {
    message: "Passwords do not match",
    path: ["password_confirm"],
  });

type Values = z.infer<typeof schema>;

function passwordStrength(password: string): { label: string; score: number } {
  let score = 0;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (score <= 1) return { label: "Weak", score };
  if (score === 2) return { label: "Fair", score };
  if (score === 3) return { label: "Good", score };
  return { label: "Strong", score };
}

function ActivateFormInner() {
  const search = useSearchParams();
  const [activate, activateRequest] = useActivateAccountMutation();
  const [resend, resendRequest] = useResendActivationMutation();
  const [done, setDone] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: search.get("email") ?? "",
      token: search.get("token") ?? "",
      password: "",
      password_confirm: "",
    },
  });
  const password = useWatch({ control: form.control, name: "password" }) ?? "";
  const strength = passwordStrength(password);

  useEffect(() => {
    const email = search.get("email");
    const token = search.get("token");
    if (email) form.setValue("email", email);
    if (token) form.setValue("token", token);
  }, [search, form]);

  async function onSubmit(values: Values) {
    try {
      await activate(values).unwrap();
      setDone(true);
    } catch {
      // Rendered below.
    }
  }

  if (done) {
    return (
      <div className="rounded-[1.5rem] border border-border bg-white p-8 text-center shadow-[var(--shadow-card)]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Account ready</p>
        <h1 className="mt-3 text-3xl text-navy">Welcome to Mzansi Visa Solutions</h1>
        <p className="mt-3 text-muted">Your account is ready. Sign in to open your client dashboard.</p>
        <div className="mt-8">
          <Button href="/login?next=/portal">Continue to Client Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-4 rounded-[1.5rem] border border-border bg-white p-6 shadow-[var(--shadow-card)] sm:p-8" onSubmit={form.handleSubmit(onSubmit)}>
      <Input type="email" label="Email" error={form.formState.errors.email?.message ?? getFieldError(activateRequest.error, "email")} {...form.register("email")} />
      <Input label="Activation token" error={form.formState.errors.token?.message ?? getFieldError(activateRequest.error, "token")} {...form.register("token")} />
      <Input type="password" autoComplete="new-password" label="Create password" error={form.formState.errors.password?.message} {...form.register("password")} />
      {password ? (
        <p className="text-xs text-muted">
          Strength: <span className="font-medium text-navy">{strength.label}</span>
        </p>
      ) : null}
      <Input
        type="password"
        autoComplete="new-password"
        label="Confirm password"
        error={form.formState.errors.password_confirm?.message}
        {...form.register("password_confirm")}
      />
      {activateRequest.isError ? <p className="text-sm text-red-600">{getErrorMessage(activateRequest.error)}</p> : null}
      <Button type="submit" className="w-full" disabled={activateRequest.isLoading}>
        {activateRequest.isLoading ? "Activating…" : "Activate my account"}
      </Button>
      <div className="border-t border-border pt-4">
        <p className="text-sm text-muted">Link expired? Request a new activation email.</p>
        <Button
          type="button"
          variant="outline"
          className="mt-3"
          disabled={resendRequest.isLoading || !form.getValues("email")}
          onClick={() => void resend({ email: form.getValues("email") })}
        >
          {resendRequest.isLoading ? "Sending…" : "Request new activation link"}
        </Button>
        {resendRequest.isSuccess ? (
          <p className="mt-2 text-sm text-emerald-700">If an account needs activation, a new link has been sent.</p>
        ) : null}
      </div>
      <p className="text-center text-sm text-muted">
        Already activated?{" "}
        <Link href="/login" className="font-medium text-brand">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function ActivateForm() {
  return (
    <Suspense fallback={<Spinner className="py-16" />}>
      <ActivateFormInner />
    </Suspense>
  );
}
