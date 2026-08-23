"use client";

import Link from "next/link";

import { InquiryForm } from "@/components/forms/InquiryForm";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { isClientUser } from "@/lib/roles";
import { useAppSelector } from "@/store/hooks";

export function ContactForms() {
  const hydrated = useAppSelector((state) => state.auth.hydrated);
  const user = useAppSelector((state) => state.auth.user);
  const canSubmit = hydrated && isClientUser(user);

  return (
    <div className="grid gap-8">
      <Card>
        <CardHeader>
          <h2 className="text-2xl text-navy">Book a consultation</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-sm text-muted">
            You can book a consultation without creating an account. After confirmation, new clients receive a secure activation link to set
            their own password.
          </p>
          <Button href="/book">Book a Consultation</Button>
        </CardBody>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="text-2xl text-navy">Send an enquiry</h2>
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
