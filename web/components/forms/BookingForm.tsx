"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { Textarea } from "@/components/ui/Textarea";
import { formatDateTime, todayInput } from "@/lib/dates";
import { getErrorMessage } from "@/lib/errors";
import {
  useCreateAppointmentMutation,
  useGetAppointmentSlotsQuery,
  useGetConsultationTypesQuery,
  useGetConsultantsQuery,
} from "@/store/api";

const schema = z.object({
  consultation_type_id: z.string().min(1, "Choose a consultation type"),
  consultant_id: z.string().min(1, "Choose a consultant"),
  date: z.string().min(1, "Choose a date"),
  starts_at: z.string().min(1, "Choose a time"),
  client_notes: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export function BookingForm({ onBooked }: { onBooked?: () => void }) {
  const types = useGetConsultationTypesQuery();
  const consultants = useGetConsultantsQuery();
  const [createAppointment, request] = useCreateAppointmentMutation();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      consultation_type_id: "",
      consultant_id: "",
      date: todayInput(),
      starts_at: "",
      client_notes: "",
    },
  });
  const consultantId = useWatch({ control: form.control, name: "consultant_id" });
  const date = useWatch({ control: form.control, name: "date" });
  const typeId = useWatch({ control: form.control, name: "consultation_type_id" });
  const consultantNumeric = Number(consultantId);
  const typeNumeric = Number(typeId);
  const slots = useGetAppointmentSlotsQuery(
    {
      consultant_id: consultantNumeric,
      date,
      consultation_type_id: typeNumeric || undefined,
    },
    { skip: !consultantId || !date || Number.isNaN(consultantNumeric) },
  );

  useEffect(() => {
    form.setValue("starts_at", "");
  }, [consultantId, date, typeId, form]);

  async function onSubmit(values: Values) {
    try {
      await createAppointment({
        consultation_type_id: Number(values.consultation_type_id),
        consultant_id: Number(values.consultant_id),
        starts_at: values.starts_at,
        client_notes: values.client_notes,
      }).unwrap();
      form.reset({ ...values, starts_at: "", client_notes: "" });
      onBooked?.();
    } catch {
      // Rendered below.
    }
  }

  if (types.isLoading || consultants.isLoading) {
    return <Spinner className="py-10" />;
  }
  if (types.isError || consultants.isError) {
    return <ErrorState description="Consultation options could not be loaded." />;
  }
  const typeList = types.data ?? [];
  const consultantList = consultants.data ?? [];
  if (typeList.length === 0 || consultantList.length === 0) {
    return (
      <EmptyState
        title="Booking is not open yet"
        description="Consultation types or available consultants have not been published."
      />
    );
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <Select label="Consultation type" error={form.formState.errors.consultation_type_id?.message} {...form.register("consultation_type_id")}>
        <option value="">Select a type</option>
        {typeList.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name} · {item.duration_minutes} min · {item.price}
          </option>
        ))}
      </Select>
      <Select label="Consultant" error={form.formState.errors.consultant_id?.message} {...form.register("consultant_id")}>
        <option value="">Select a consultant</option>
        {consultantList.map((item) => (
          <option key={item.id} value={item.id}>
            {item.full_name}
            {item.job_title ? ` · ${item.job_title}` : ""}
          </option>
        ))}
      </Select>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-charcoal">Date</span>
        <input type="date" min={todayInput()} className="h-11 w-full rounded-xl border border-border px-3.5 text-sm" {...form.register("date")} />
      </label>
      <Select label="Available time" error={form.formState.errors.starts_at?.message} {...form.register("starts_at")}>
        <option value="">{slots.isFetching ? "Loading times…" : "Select a slot"}</option>
        {(slots.data ?? []).map((slot) => (
          <option key={slot.starts_at} value={slot.starts_at}>
            {formatDateTime(slot.starts_at)}
          </option>
        ))}
      </Select>
      {slots.isSuccess && (slots.data?.length ?? 0) === 0 ? (
        <p className="text-sm text-muted">No open slots on this date. Try another day or consultant.</p>
      ) : null}
      <Textarea label="Notes (optional)" {...form.register("client_notes")} />
      {request.isError ? <p className="text-sm text-red-600">{getErrorMessage(request.error)}</p> : null}
      {request.isSuccess ? <p className="text-sm text-emerald-700">Booking received. You will see it under consultations.</p> : null}
      <Button type="submit" disabled={request.isLoading}>
        {request.isLoading ? "Booking…" : "Confirm booking"}
      </Button>
    </form>
  );
}
