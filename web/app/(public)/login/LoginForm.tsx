"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { getErrorMessage, getFieldError } from "@/lib/errors";
import { homePathForRole } from "@/lib/roles";
import { useLoginMutation } from "@/store/api";
import { persistSession } from "@/store/authSlice";
import { useAppDispatch } from "@/store/hooks";

const schema = z.object({
  email: z.string().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

type Values = z.infer<typeof schema>;

function LoginFormInner() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const search = useSearchParams();
  const [login, request] = useLoginMutation();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  async function onSubmit(values: Values) {
    try {
      const data = await login(values).unwrap();
      await dispatch(persistSession({ access: data.access, refresh: data.refresh, user: data.user })).unwrap();
      const next = search.get("next");
      router.replace(next && next.startsWith("/") ? next : homePathForRole(data.user.role));
    } catch {
      // Rendered below.
    }
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <Input type="email" autoComplete="email" label="Email" error={form.formState.errors.email?.message ?? getFieldError(request.error, "email")} {...form.register("email")} />
      <Input type="password" autoComplete="current-password" label="Password" error={form.formState.errors.password?.message ?? getFieldError(request.error, "password")} {...form.register("password")} />
      {request.isError ? <p className="text-sm text-red-600">{getErrorMessage(request.error)}</p> : null}
      <Button type="submit" className="w-full" disabled={request.isLoading}>
        {request.isLoading ? "Signing in…" : "Sign in"}
      </Button>
      <div className="flex items-center justify-between text-sm">
        <Link href="/register" className="font-medium text-brand">
          Create an account
        </Link>
        <Link href="/contact" className="text-muted hover:text-navy">
          Need help?
        </Link>
      </div>
    </form>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={<Spinner />}>
      <LoginFormInner />
    </Suspense>
  );
}
