"use client";

import Link from "next/link";

import { BookingForm } from "@/components/forms/BookingForm";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { isClientUser } from "@/lib/roles";
import { useAppSelector } from "@/store/hooks";

export function ContactForms() {
  const hydrated = useAppSelector((state) => state.auth.hydrated);
  const user = useAppSelector((state) => state.auth.user);
  const canSubmit = hydrated && isClientUser(user);

  return (
    <div className="mt-12 grid gap-8 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <h2 className="font-serif text-2xl text-navy">Book a consultation</h2>
        </CardHeader>
        <CardBody>
          {canSubmit ? (
            <BookingForm />
          ) : (
            <p className="text-sm text-muted">
              <Link href="/login?next=/contact" className="text-brand">
                Sign in
              </Link>{" "}
              or{" "}
              <Link href="/register?next=/contact" className="text-brand">
                create a client account
              </Link>{" "}
              to request a consultation time.
            </p>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="font-serif text-2xl text-navy">Send an enquiry</h2>
        </CardHeader>
        <CardBody>
          {canSubmit ? (
            <InquiryForm />
          ) : (
            <p className="text-sm text-muted">
              Enquiries are sent from your client profile so we can keep the conversation in one place.{" "}
              <Link href="/login?next=/contact" className="text-brand">
                Sign in to continue
              </Link>
              .
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
