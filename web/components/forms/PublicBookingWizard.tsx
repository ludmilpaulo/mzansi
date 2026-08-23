"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronLeft } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { Textarea } from "@/components/ui/Textarea";
import { getSlotAlternatives, isSlotUnavailable } from "@/lib/booking-errors";
import { downloadConsultationIcs } from "@/lib/calendar";
import { cn } from "@/lib/cn";
import { formatDate, formatDateTime, todayInput } from "@/lib/dates";
import { getErrorMessage, getFieldError } from "@/lib/errors";
import {
  useBookPublicConsultationMutation,
  useGetCurrentTermsQuery,
  useGetPublicConsultationTypesQuery,
  useGetPublicConsultantsQuery,
  useGetPublicSlotsQuery,
  useHoldPublicSlotMutation,
} from "@/store/api";
import type { AppointmentSlot, PublicBookResponse } from "@/types/api";

const contactSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Surname is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(7, "Enter a valid phone number"),
  nationality: z.string().min(2, "Nationality is required"),
  current_country: z.string().min(2, "Country of residence is required"),
  matter_summary: z.string().min(10, "Please briefly describe your immigration matter"),
  preferred_language: z.string().optional(),
  additional_message: z.string().optional(),
  accept_terms: z.boolean().refine((value) => value === true, {
    message: "You must accept the Terms & Privacy Policy",
  }),
});

type ContactValues = z.infer<typeof contactSchema>;

type Step = "type" | "date" | "time" | "details" | "review" | "done";

const STEPS: Step[] = ["type", "date", "time", "details", "review"];

function formatSast(slot: AppointmentSlot): string {
  if (slot.label_sast) {
    return `${slot.label_sast} SAST`;
  }
  return formatDateTime(slot.starts_at);
}

function holdCountdown(expiresAt: string | null): string {
  if (!expiresAt) {
    return "";
  }
  const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function PublicBookingWizard() {
  const types = useGetPublicConsultationTypesQuery();
  const consultants = useGetPublicConsultantsQuery();
  const terms = useGetCurrentTermsQuery();
  const [holdSlot, holdRequest] = useHoldPublicSlotMutation();
  const [bookConsultation, bookRequest] = useBookPublicConsultationMutation();

  const [step, setStep] = useState<Step>("type");
  const [typeId, setTypeId] = useState<number | null>(null);
  const [consultantId, setConsultantId] = useState<number | null>(null);
  const [date, setDate] = useState(todayInput());
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null);
  const [holdId, setHoldId] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [alternatives, setAlternatives] = useState<AppointmentSlot[]>([]);
  const [confirmation, setConfirmation] = useState<PublicBookResponse | null>(null);
  const [slotError, setSlotError] = useState<string | null>(null);

  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      nationality: "",
      current_country: "",
      matter_summary: "",
      preferred_language: "en",
      additional_message: "",
      accept_terms: false,
    },
  });

  const typeList = types.data ?? [];
  const consultantList = consultants.data ?? [];
  const selectedType = typeList.find((item) => item.id === typeId) ?? null;
  const effectiveConsultantId =
    consultantId ?? (consultantList.length === 1 ? consultantList[0]?.id ?? null : null);
  const selectedConsultant = consultantList.find((item) => item.id === effectiveConsultantId) ?? null;
  const stepIndex = STEPS.indexOf(step === "done" ? "review" : step);

  const slots = useGetPublicSlotsQuery(
    {
      consultant_id: effectiveConsultantId ?? 0,
      date,
      consultation_type_id: typeId ?? undefined,
      hold_id: holdId ?? undefined,
    },
    { skip: !effectiveConsultantId || !date || step === "type" },
  );

  useEffect(() => {
    if (!holdExpiresAt) {
      return;
    }
    const id = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [holdExpiresAt]);

  const visitorTz = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Johannesburg";
    } catch {
      return "Africa/Johannesburg";
    }
  }, []);

  async function reserveSlot(slot: AppointmentSlot) {
    if (!typeId || !effectiveConsultantId) {
      return;
    }
    setSlotError(null);
    setAlternatives([]);
    try {
      const hold = await holdSlot({
        consultation_type_id: typeId,
        consultant_id: effectiveConsultantId,
        starts_at: slot.starts_at,
      }).unwrap();
      setSelectedSlot(slot);
      setHoldId(hold.hold_id);
      setHoldExpiresAt(hold.expires_at);
      setStep("details");
    } catch (error) {
      if (isSlotUnavailable(error)) {
        setSlotError("This consultation time has just been booked.");
        setAlternatives(getSlotAlternatives(error));
        return;
      }
      setSlotError(getErrorMessage(error));
    }
  }

  async function confirmBooking(values: ContactValues) {
    if (!typeId || !effectiveConsultantId || !selectedSlot || !terms.data?.version) {
      return;
    }
    setSlotError(null);
    try {
      const result = await bookConsultation({
        consultation_type_id: typeId,
        consultant_id: effectiveConsultantId,
        starts_at: selectedSlot.starts_at,
        hold_id: holdId,
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        phone: values.phone,
        nationality: values.nationality,
        current_country: values.current_country,
        matter_summary: values.matter_summary,
        preferred_language: values.preferred_language || "en",
        additional_message: values.additional_message || "",
        timezone_name: visitorTz,
        terms_version: terms.data.version,
        accept_terms: true,
      }).unwrap();
      setConfirmation(result);
      setStep("done");
      setHoldId(null);
      setHoldExpiresAt(null);
    } catch (error) {
      if (isSlotUnavailable(error)) {
        setSlotError("This appointment time has just been booked.");
        setAlternatives(getSlotAlternatives(error));
        setStep("time");
        setSelectedSlot(null);
        setHoldId(null);
        setHoldExpiresAt(null);
        return;
      }
      setSlotError(getErrorMessage(error));
    }
  }

  if (types.isLoading || consultants.isLoading || terms.isLoading) {
    return <Spinner className="py-16" />;
  }
  if (types.isError || consultants.isError) {
    return <ErrorState description="Consultation booking could not be loaded." />;
  }
  if (typeList.length === 0 || consultantList.length === 0) {
    return (
      <EmptyState
        title="Booking is not open yet"
        description="Consultation types or consultants have not been published. Please check back soon or send an enquiry."
      />
    );
  }

  if (step === "done" && confirmation) {
    const appt = confirmation.appointment;
    return (
      <div className="rounded-[1.5rem] border border-border bg-white p-8 shadow-[var(--shadow-card)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <Check className="h-7 w-7" />
        </div>
        <p className="mt-6 text-center text-xs font-semibold uppercase tracking-[0.18em] text-brand">Consultation confirmed</p>
        <h2 className="mt-3 text-center text-3xl text-navy">Thank you, {confirmation.client.first_name}.</h2>
        <p className="mt-3 text-center text-muted">{confirmation.message}</p>
        <dl className="mt-8 space-y-3 rounded-2xl bg-soft p-5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Consultation</dt>
            <dd className="font-medium text-navy">{appt.consultation_type}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Date</dt>
            <dd className="font-medium text-navy">{formatDate(appt.starts_at)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Time</dt>
            <dd className="font-medium text-navy">{formatDateTime(appt.starts_at)} ({appt.timezone_name || "SAST"})</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Duration</dt>
            <dd className="font-medium text-navy">{appt.duration_minutes} minutes</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Consultant</dt>
            <dd className="font-medium text-navy">{appt.consultant_name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Confirmation</dt>
            <dd className="font-mono text-sm font-medium text-navy">{appt.reference_number}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Email</dt>
            <dd className="font-medium text-navy">{confirmation.client.email}</dd>
          </div>
        </dl>
        {confirmation.activation_required ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            A secure account activation link has been sent to {confirmation.client.email}. It expires in 72 hours.
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={() =>
              downloadConsultationIcs({
                title: `Mzansi consultation — ${appt.consultation_type}`,
                description: `Confirmation ${appt.reference_number} with ${appt.consultant_name}`,
                startsAt: appt.starts_at,
                endsAt: appt.ends_at,
                reference: appt.reference_number,
              })
            }
          >
            Add to Calendar
          </Button>
          <Button href={confirmation.activation_required ? "/activate" : "/login?next=/portal/consultations"} variant="outline">
            {confirmation.activation_required ? "Activate account" : "View consultation"}
          </Button>
          <Button href="/" variant="ghost">
            Return to website
          </Button>
        </div>
        <p className="mt-6 text-xs text-muted">
          Mzansi Visa Solutions provides professional immigration assistance. Immigration decisions are made by the relevant South African
          authorities. No outcome can be guaranteed.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[1.5rem] border border-border bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
      <div className="mb-8 flex flex-wrap gap-2">
        {STEPS.map((item, index) => (
          <span
            key={item}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold capitalize",
              index <= stepIndex ? "bg-brand text-white" : "bg-soft text-muted",
            )}
          >
            {index + 1}. {item}
          </span>
        ))}
      </div>

      {holdExpiresAt && selectedSlot && step !== "done" ? (
        <p className="mb-6 rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 text-sm text-charcoal">
          {formatSast(selectedSlot)} reserved for you for{" "}
          <span className="font-semibold text-brand" key={tick}>
            {holdCountdown(holdExpiresAt)}
          </span>
        </p>
      ) : null}

      {slotError ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
          <p className="font-semibold text-amber-950">{slotError}</p>
          {alternatives.length > 0 ? (
            <>
              <p className="mt-2 text-sm text-amber-900">Don&apos;t worry — we found the next available times for you.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {alternatives.map((slot) => (
                  <Button key={slot.starts_at} type="button" size="sm" variant="outline" onClick={() => void reserveSlot(slot)}>
                    {formatDateTime(slot.starts_at)}
                  </Button>
                ))}
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      {step === "type" ? (
        <div className="space-y-4">
          <h2 className="text-2xl text-navy">Choose consultation type</h2>
          <p className="text-sm text-muted">No account required. You will create a secure password after booking if you are new.</p>
          <div className="grid gap-3">
            {typeList.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setTypeId(item.id);
                  setStep("date");
                }}
                className={cn(
                  "rounded-2xl border px-5 py-4 text-left transition hover:border-brand",
                  typeId === item.id ? "border-brand bg-brand/5" : "border-border bg-white",
                )}
              >
                <p className="font-semibold text-navy">{item.name}</p>
                <p className="mt-1 text-sm text-muted">
                  {item.duration_minutes} min · {item.price}
                </p>
                {item.description ? <p className="mt-2 text-sm text-charcoal">{item.description}</p> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === "date" ? (
        <div className="space-y-4">
          <button type="button" className="inline-flex items-center gap-1 text-sm text-muted hover:text-navy" onClick={() => setStep("type")}>
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <h2 className="text-2xl text-navy">Choose date</h2>
          {consultantList.length > 1 ? (
            <Select
              label="Consultant"
              value={consultantId ?? ""}
              onChange={(event) => setConsultantId(Number(event.target.value) || null)}
            >
              <option value="">Select a consultant</option>
              {consultantList.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.full_name}
                  {item.job_title ? ` · ${item.job_title}` : ""}
                </option>
              ))}
            </Select>
          ) : (
            <p className="text-sm text-muted">Consultant: {selectedConsultant?.full_name}</p>
          )}
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-charcoal">Date</span>
            <input
              type="date"
              min={todayInput()}
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setSelectedSlot(null);
              }}
              className="h-11 w-full rounded-xl border border-border px-3.5 text-sm"
            />
          </label>
          <p className="text-xs text-muted">Times are shown in South Africa Time (SAST). Your timezone appears as {visitorTz}.</p>
          <Button type="button" disabled={!effectiveConsultantId || !date} onClick={() => setStep("time")}>
            Continue to times
          </Button>
        </div>
      ) : null}

      {step === "time" ? (
        <div className="space-y-4">
          <button type="button" className="inline-flex items-center gap-1 text-sm text-muted hover:text-navy" onClick={() => setStep("date")}>
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <h2 className="text-2xl text-navy">Choose available time</h2>
          <p className="text-sm text-muted">
            {selectedType?.name} · {formatDate(date)} · {selectedConsultant?.full_name}
          </p>
          {slots.isFetching ? <Spinner className="py-8" /> : null}
          {slots.isSuccess && (slots.data?.slots.length ?? 0) === 0 ? (
            <p className="text-sm text-muted">No open slots on this date. Try another day.</p>
          ) : null}
          <div className="grid gap-2 sm:grid-cols-3">
            {(slots.data?.slots ?? []).map((slot) => (
              <button
                key={slot.starts_at}
                type="button"
                disabled={holdRequest.isLoading}
                onClick={() => void reserveSlot(slot)}
                className="rounded-xl border border-border px-3 py-3 text-sm font-medium text-navy transition hover:border-brand hover:bg-brand/5 disabled:opacity-60"
              >
                {formatSast(slot)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {step === "details" || step === "review" ? (
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => {
            if (step === "details") {
              setStep("review");
              return;
            }
            void confirmBooking(values);
          })}
        >
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm text-muted hover:text-navy"
            onClick={() => setStep(step === "review" ? "details" : "time")}
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <h2 className="text-2xl text-navy">{step === "details" ? "Your contact details" : "Review booking"}</h2>
          {step === "review" ? (
            <div className="rounded-2xl bg-soft p-4 text-sm text-charcoal">
              <p>
                <span className="text-muted">Type:</span> {selectedType?.name}
              </p>
              <p className="mt-1">
                <span className="text-muted">When:</span> {selectedSlot ? formatDateTime(selectedSlot.starts_at) : "—"} SAST
              </p>
              <p className="mt-1">
                <span className="text-muted">Consultant:</span> {selectedConsultant?.full_name}
              </p>
            </div>
          ) : null}
          <div className={cn("grid gap-4 sm:grid-cols-2", step === "review" && "pointer-events-none opacity-90")}>
            <Input label="First name" error={form.formState.errors.first_name?.message} {...form.register("first_name")} />
            <Input label="Surname" error={form.formState.errors.last_name?.message} {...form.register("last_name")} />
            <Input type="email" label="Email" error={form.formState.errors.email?.message ?? getFieldError(bookRequest.error, "email")} {...form.register("email")} />
            <Input label="Cell phone" error={form.formState.errors.phone?.message} {...form.register("phone")} />
            <Input label="Nationality" error={form.formState.errors.nationality?.message} {...form.register("nationality")} />
            <Input label="Country of residence" error={form.formState.errors.current_country?.message} {...form.register("current_country")} />
          </div>
          <Textarea
            label="Brief description of your immigration matter"
            error={form.formState.errors.matter_summary?.message}
            {...form.register("matter_summary")}
          />
          <Input label="Preferred language (optional)" {...form.register("preferred_language")} />
          <Textarea label="Additional message (optional)" {...form.register("additional_message")} />
          <label className="flex items-start gap-3 text-sm text-charcoal">
            <input type="checkbox" className="mt-1" {...form.register("accept_terms")} />
            <span>
              I have read and agree to the Mzansi Visa Solutions{" "}
              <Link href="/terms" className="font-medium text-brand" target="_blank">
                Terms &amp; Conditions
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="font-medium text-brand" target="_blank">
                Privacy Policy
              </Link>
              {terms.data?.version ? ` (version ${terms.data.version})` : ""}.
            </span>
          </label>
          {form.formState.errors.accept_terms ? (
            <p className="text-xs text-red-600">{form.formState.errors.accept_terms.message}</p>
          ) : null}
          {bookRequest.isError && !isSlotUnavailable(bookRequest.error) ? (
            <p className="text-sm text-red-600">{getErrorMessage(bookRequest.error)}</p>
          ) : null}
          <Button type="submit" disabled={bookRequest.isLoading || holdRequest.isLoading}>
            {step === "details" ? "Review booking" : bookRequest.isLoading ? "Confirming…" : "Confirm consultation"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
