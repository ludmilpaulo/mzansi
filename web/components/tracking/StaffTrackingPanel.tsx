"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { formatDateTime } from "@/lib/dates";
import { getErrorMessage } from "@/lib/errors";
import { trackingTone } from "@/lib/tracking";
import {
  useGetApplicationTrackingQuery,
  useRecordManualTrackingMutation,
  useRefreshApplicationTrackingMutation,
  useUpdateApplicationTrackingMutation,
} from "@/store/api";
import type { TrackingStatus } from "@/types/api";

interface TrackingDraft {
  reference: string;
  country: string;
  centre: string;
  enabled: boolean;
}

const MANUAL_STATUSES: { value: TrackingStatus; label: string }[] = [
  { value: "APPLICATION_RECEIVED", label: "Application Received" },
  { value: "APPLICATION_UNDER_PROCESS", label: "Application Under Process" },
  { value: "DECISION_RETURNED", label: "Decision Returned" },
  { value: "READY_FOR_COLLECTION", label: "Ready for Collection" },
  { value: "UNKNOWN", label: "Unknown" },
];

export function StaffTrackingPanel({ applicationId }: { applicationId: number }) {
  const tracking = useGetApplicationTrackingQuery(applicationId, { skip: !applicationId });
  const [updateDetails, updateReq] = useUpdateApplicationTrackingMutation();
  const [refresh, refreshReq] = useRefreshApplicationTrackingMutation();
  const [manual, manualReq] = useRecordManualTrackingMutation();
  const [draft, setDraft] = useState<TrackingDraft | null>(null);
  const [passport, setPassport] = useState("");
  const [dob, setDob] = useState("");
  const [statusCode, setStatusCode] = useState<TrackingStatus>("APPLICATION_UNDER_PROCESS");
  const [note, setNote] = useState("");

  const item = tracking.data;
  const form: TrackingDraft = draft ?? {
    reference: item?.reference_number ?? "",
    country: item?.country ?? "South Africa",
    centre: item?.application_centre ?? "Cape Town",
    enabled: item?.tracking_enabled ?? true,
  };

  function updateDraft(patch: Partial<TrackingDraft>) {
    setDraft({ ...form, ...patch });
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-serif text-2xl text-navy">VFS / DHA tracking</h2>
      </CardHeader>
      <CardBody className="space-y-4">
        {item ? (
          <div className="flex flex-wrap gap-2">
            <Badge tone="info">Mzansi: {item.internal_status.label}</Badge>
            {item.status_label ? <Badge tone={trackingTone(item.status)}>VFS: {item.status_label}</Badge> : null}
            {item.manually_updated ? <Badge tone="warning">Manually updated</Badge> : null}
          </div>
        ) : null}
        {item?.passport_masked ? <p className="text-sm text-muted">Passport on file: {item.passport_masked}</p> : null}
        {item?.checked_at ? <p className="text-sm text-muted">Last checked {formatDateTime(item.checked_at)}</p> : null}
        <Input label="VFS reference number" value={form.reference} onChange={(event) => updateDraft({ reference: event.target.value })} />
        <Input
          label="Passport number"
          value={passport}
          onChange={(event) => setPassport(event.target.value)}
          placeholder={item?.passport_masked ? "Enter only to replace the stored number" : ""}
          autoComplete="off"
        />
        <Input
          label="Date of birth"
          type="date"
          value={dob}
          onChange={(event) => setDob(event.target.value)}
        />
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Country" value={form.country} onChange={(event) => updateDraft({ country: event.target.value })} />
          <Input label="Application centre" value={form.centre} onChange={(event) => updateDraft({ centre: event.target.value })} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.enabled} onChange={(event) => updateDraft({ enabled: event.target.checked })} />
          Tracking enabled
        </label>
        {updateReq.isError ? <p className="text-sm text-red-600">{getErrorMessage(updateReq.error)}</p> : null}
        <Button
          type="button"
          disabled={updateReq.isLoading}
          onClick={() =>
            void updateDetails({
              id: applicationId,
              body: {
                reference_number: form.reference,
                passport_number: passport || undefined,
                date_of_birth: dob || undefined,
                country: form.country,
                application_centre: form.centre,
                tracking_enabled: form.enabled,
                provider: "VFS",
              },
            }).then(() => setDraft(null))
          }
        >
          Save tracking details
        </Button>
        {refreshReq.isError ? <p className="text-sm text-red-600">{getErrorMessage(refreshReq.error)}</p> : null}
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" disabled={refreshReq.isLoading} onClick={() => void refresh(applicationId)}>
            Refresh status
          </Button>
          {item ? (
            <a
              href={item.fallback_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-semibold"
            >
              Official VFS page
            </a>
          ) : null}
        </div>
        {item?.can_manual_update ? (
          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-sm font-medium text-navy">Manual external status</p>
            <p className="text-xs text-muted">Use this only when confirmed through official VFS communication. It will be labelled manually updated.</p>
            <Select
              label="External status"
              value={statusCode}
              onChange={(event) => setStatusCode(event.target.value as TrackingStatus)}
            >
              {MANUAL_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>
            <Textarea label="Note" value={note} onChange={(event) => setNote(event.target.value)} />
            {manualReq.isError ? <p className="text-sm text-red-600">{getErrorMessage(manualReq.error)}</p> : null}
            <Button
              type="button"
              variant="secondary"
              disabled={manualReq.isLoading}
              onClick={() => void manual({ id: applicationId, body: { status_code: statusCode, note } })}
            >
              Record manual status
            </Button>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
