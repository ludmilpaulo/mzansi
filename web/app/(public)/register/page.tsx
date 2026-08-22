import type { Metadata } from "next";

import { RegisterForm } from "@/app/(public)/register/RegisterForm";

export const metadata: Metadata = {
  title: "Create account",
  description: "Open a client profile to book consultations and, when ready, start an application.",
};

export default function RegisterPage() {
  return (
    <div className="page-shell grid gap-12 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
      <div className="lg:sticky lg:top-28">
        <p className="eyebrow">Client registration</p>
        <h1 className="mt-3 font-serif text-5xl text-navy">Create a client account</h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          We will open a profile. An application is created only after you choose a service — we never promise visa
          approval.
        </p>
        <ul className="mt-8 space-y-3 text-sm text-charcoal">
          <li className="rounded-2xl bg-white px-4 py-3 shadow-[var(--shadow-card)]">Book a consultation when you are ready</li>
          <li className="rounded-2xl bg-white px-4 py-3 shadow-[var(--shadow-card)]">Upload documents through a private checklist</li>
          <li className="rounded-2xl bg-white px-4 py-3 shadow-[var(--shadow-card)]">See exactly what to do next</li>
        </ul>
      </div>
      <div className="rounded-[1.6rem] border border-border bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
        <RegisterForm />
      </div>
    </div>
  );
}
