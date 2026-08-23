import type { Metadata } from "next";

import { LoginForm } from "@/app/(public)/login/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to the Mzansi Visa Solutions client portal or staff workspace.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="grid min-h-[calc(100vh-5rem)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-navy lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1600&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-navy/70" />
        <div className="relative flex h-full flex-col justify-end p-12 text-white">
          <div>
            <p className="font-serif text-4xl leading-tight">Your documents. Your next step. One secure place.</p>
            <p className="mt-4 max-w-md text-sm text-white/70">
              Clients track applications and uploads here. Staff use the same sign-in with their assigned role.
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center px-6 py-16 sm:px-12">
        <div className="mx-auto w-full max-w-md">
          <p className="eyebrow">Welcome back</p>
          <h1 className="mt-3 font-serif text-4xl text-navy">Sign in</h1>
          <p className="mt-2 text-sm text-muted">Use your client or staff email.</p>
          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
