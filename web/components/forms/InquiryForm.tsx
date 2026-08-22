"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { getErrorMessage, getFieldError } from "@/lib/errors";
import { useCreateInquiryMutation } from "@/store/api";

const schema = z.object({
  subject: z.string().min(3, "Please add a subject"),
  category: z.enum(["APPLICATION", "DOCUMENTS", "PAYMENT", "CONSULTATION", "GENERAL"]),
  message: z.string().min(10, "Please add a little more detail"),
});

type Values = z.infer<typeof schema>;

export function InquiryForm({ onSuccess }: { onSuccess?: () => void }) {
  const [createInquiry, request] = useCreateInquiryMutation();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { subject: "", category: "GENERAL", message: "" },
  });

  async function onSubmit(values: Values) {
    try {
      await createInquiry({
        subject: values.subject,
        category: values.category,
        message: values.message,
      }).unwrap();
      form.reset();
      onSuccess?.();
    } catch {
      // Rendered below.
    }
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <Input label="Subject" error={form.formState.errors.subject?.message ?? getFieldError(request.error, "subject")} {...form.register("subject")} />
      <Select label="Category" error={form.formState.errors.category?.message} {...form.register("category")}>
        <option value="GENERAL">General</option>
        <option value="APPLICATION">Application</option>
        <option value="DOCUMENTS">Documents</option>
        <option value="PAYMENT">Payment</option>
        <option value="CONSULTATION">Consultation</option>
      </Select>
      <Textarea label="Message" error={form.formState.errors.message?.message ?? getFieldError(request.error, "message")} {...form.register("message")} />
      {request.isError ? <p className="text-sm text-red-600">{getErrorMessage(request.error)}</p> : null}
      {request.isSuccess ? <p className="text-sm text-emerald-700">Message sent. We will reply in the portal.</p> : null}
      <Button type="submit" disabled={request.isLoading}>
        {request.isLoading ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
