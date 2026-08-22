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
import { useRegisterMutation } from "@/store/api";
import { persistSession } from "@/store/authSlice";
import { useAppDispatch } from "@/store/hooks";

const schema = z
  .object({
    first_name: z.string().min(1, "Required"),
    last_name: z.string().min(1, "Required"),
    email: z.string().min(1, "Required"),
    phone: z.string().min(1, "Required"),
    country_of_nationality: z.string().min(1, "Required"),
    current_country: z.string().min(1, "Required"),
    date_of_birth: z.string().optional(),
    passport_number: z.string().optional(),
    preferred_language: z.string().min(1),
    password: z.string().min(10, "Use at least 10 characters"),
    password_confirm: z.string().min(10, "Confirm your password"),
  })
  .refine((value) => value.password === value.password_confirm, {
    message: "Passwords do not match",
    path: ["password_confirm"],
  });

type Values = z.infer<typeof schema>;

function RegisterFormInner() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const search = useSearchParams();
  const [registerUser, request] = useRegisterMutation();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      country_of_nationality: "",
      current_country: "",
      date_of_birth: "",
      passport_number: "",
      preferred_language: "en",
      password: "",
      password_confirm: "",
    },
  });

  async function onSubmit(values: Values) {
    try {
      const data = await registerUser({
        ...values,
        date_of_birth: values.date_of_birth || null,
      }).unwrap();
      await dispatch(
        persistSession({
          access: data.tokens.access,
          refresh: data.tokens.refresh,
          user: data.user,
        }),
      ).unwrap();
      const next = search.get("next");
      router.replace(next && next.startsWith("/") ? next : "/portal");
    } catch {
      // Rendered below.
    }
  }

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
      <Input label="First name" error={form.formState.errors.first_name?.message ?? getFieldError(request.error, "first_name")} {...form.register("first_name")} />
      <Input label="Last name" error={form.formState.errors.last_name?.message ?? getFieldError(request.error, "last_name")} {...form.register("last_name")} />
      <Input className="md:col-span-2" type="email" label="Email" error={form.formState.errors.email?.message ?? getFieldError(request.error, "email")} {...form.register("email")} />
      <Input label="Phone" error={form.formState.errors.phone?.message ?? getFieldError(request.error, "phone")} {...form.register("phone")} />
      <Input label="Preferred language" {...form.register("preferred_language")} />
      <Input label="Country of nationality" error={form.formState.errors.country_of_nationality?.message ?? getFieldError(request.error, "country_of_nationality")} {...form.register("country_of_nationality")} />
      <Input label="Current country" error={form.formState.errors.current_country?.message ?? getFieldError(request.error, "current_country")} {...form.register("current_country")} />
      <Input type="date" label="Date of birth (optional)" {...form.register("date_of_birth")} />
      <Input label="Passport number (optional)" {...form.register("passport_number")} />
      <Input type="password" label="Password" error={form.formState.errors.password?.message ?? getFieldError(request.error, "password")} {...form.register("password")} />
      <Input type="password" label="Confirm password" error={form.formState.errors.password_confirm?.message ?? getFieldError(request.error, "password_confirm")} {...form.register("password_confirm")} />
      {request.isError ? <p className="md:col-span-2 text-sm text-red-600">{getErrorMessage(request.error)}</p> : null}
      <div className="md:col-span-2">
        <Button type="submit" disabled={request.isLoading}>
          {request.isLoading ? "Creating account…" : "Create account"}
        </Button>
      </div>
      <p className="md:col-span-2 text-sm text-muted">
        Already registered?{" "}
        <Link href="/login" className="text-brand">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  return (
    <Suspense fallback={<Spinner />}>
      <RegisterFormInner />
    </Suspense>
  );
}
