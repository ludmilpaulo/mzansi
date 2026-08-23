"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { TrackingJourney } from "@/components/tracking/TrackingJourney";
import { formatDate, formatDateTime } from "@/lib/dates";
import { getErrorMessage } from "@/lib/errors";
import { trackingTone } from "@/lib/tracking";
import {
  useGetApplicationTrackingHistoryQuery,
  useGetApplicationTrackingQuery,
  useRefreshApplicationTrackingMutation,
  useUpdateApplicationTrackingMutation,
} from "@/store/api";
import { useState } from "react";

export function ApplicationTrackingView({ applicationId }: { applicationId: number }) {
  const tracking = useGetApplicationTrackingQuery(applicationId, { skip: !applicationId });
  const history = useGetApplicationTrackingHistoryQuery(applicationId, { skip: !applicationId });
  const [refresh, refreshReq] = useRefreshApplicationTrackingMutation();
  const [updateDetails, updateReq] = useUpdateApplicationTrackingMutation();
  const [reference, setReference] = useState("");
  const [passport, setPassport] = useState("");
  const [dob, setDob] = useState("");

  if (tracking.isLoading) {
    return <Spinner className="min-h-[40vh]" />;
  }
  if (tracking.isError || !tracking.data) {
    return <ErrorState description={getErrorMessage(tracking.error, "Tracking is not available for this application.")} />;
  }

  const item = tracking.data;
  const refreshError = refreshReq.isError ? getErrorMessage(refreshReq.error) : "";
  const showFallback = !item.automatic_available || item.error_code === "INTEGRATION_UNAVAILABLE" || item.error_code === "EXTERNAL_UNAVAILABLE";

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Application tracking</p>
        <h1 className="mt-2 font-serif text-4xl text-navy md:text-5xl">{item.service_name}</h1>
        <p className="mt-2 text-sm text-muted">
          Application {item.application_reference}
          {item.reference_number ? ` · VFS ${item.reference_number}` : ""}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-serif text-2xl text-navy">Mzansi case status</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">What Mzansi Visa Solutions has done</p>
            <Badge tone="info">{item.internal_status.label}</Badge>
            <p className="text-sm text-muted">This is your Mzansi file status. It is separate from the VFS / DHA report.</p>
          </CardBody>
        </Card>
        <Card className="border-brand/20">
          <CardHeader>
            <h2 className="font-serif text-2xl text-navy">VFS / DHA status</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">What VFS / DHA currently reports</p>
            {item.status_label ? (
              <Badge tone={trackingTone(item.status)}>{item.status_label}</Badge>
            ) : (
              <p className="text-sm text-charcoal">No external status has been recorded yet.</p>
            )}
            {item.manually_updated ? <Badge tone="warning">Manually updated</Badge> : null}
            {item.passport_masked ? <p className="text-sm text-muted">Passport: {item.passport_masked}</p> : null}
            <p className="text-sm text-muted">
              Status source: {item.source_label || "Not retrieved"}
              {item.updated_by_name ? ` · ${item.updated_by_name}` : ""}
            </p>
            <p className="text-sm text-muted">Last verified: {item.checked_at ? formatDateTime(item.checked_at) : "Not yet checked"}</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-serif text-2xl text-navy">Application journey</h2>
        </CardHeader>
        <CardBody>
          <TrackingJourney steps={item.journey} />
          <p className="mt-4 text-xs text-muted">Only steps Mzansi can confirm are marked complete. Future steps stay open.</p>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4">
          {refreshError ? <p className="text-sm text-red-600">{refreshError}</p> : null}
          {item.error_detail && !refreshReq.isError ? <p className="text-sm text-muted">{item.error_detail}</p> : null}
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              disabled={!item.can_refresh || refreshReq.isLoading}
              onClick={() => void refresh(applicationId)}
            >
              Refresh status
            </Button>
            <a
              href={item.fallback_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-white/80 px-5 text-sm font-semibold text-charcoal hover:border-brand/50 hover:text-brand"
            >
              Track on VFS Global
            </a>
            <Button href={`/portal/applications/${applicationId}`} variant="ghost">
              View application
            </Button>
            <Button href="/portal/documents" variant="ghost">
              View documents
            </Button>
            <Button href="/portal/messages" variant="ghost">
              Message consultant
            </Button>
          </div>
          {item.next_refresh_at ? (
            <p className="text-sm text-muted">Next refresh available at {formatDateTime(item.next_refresh_at)}.</p>
          ) : item.checked_at ? (
            <p className="text-sm text-muted">Last checked {formatDateTime(item.checked_at)}.</p>
          ) : (
            <p className="text-sm text-muted">Automatic retrieval is only used when an official VFS integration is configured.</p>
          )}
          {showFallback ? (
            <p className="text-sm text-muted">
              We currently cannot automatically retrieve your latest VFS status. You can check the official VFS tracking
              system securely.
            </p>
          ) : null}
        </CardBody>
      </Card>

      {item.can_edit_details && !item.reference_number ? (
        <Card>
          <CardHeader>
            <h2 className="font-serif text-2xl text-navy">Save your VFS details</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="text-sm text-muted">
              Store the reference once so you do not have to look it up again. Passport and date of birth are encrypted and
              never shown in full.
            </p>
            <Input label="VFS reference number" value={reference} onChange={(event) => setReference(event.target.value)} />
            <Input
              label="Passport number"
              value={passport}
              onChange={(event) => setPassport(event.target.value)}
              autoComplete="off"
            />
            <Input label="Date of birth" type="date" value={dob} onChange={(event) => setDob(event.target.value)} />
            {updateReq.isError ? <p className="text-sm text-red-600">{getErrorMessage(updateReq.error)}</p> : null}
            <Button
              type="button"
              disabled={!reference || updateReq.isLoading}
              onClick={() =>
                void updateDetails({
                  id: applicationId,
                  body: {
                    reference_number: reference,
                    passport_number: passport || undefined,
                    date_of_birth: dob || undefined,
                  },
                })
              }
            >
              Save tracking details
            </Button>
          </CardBody>
        </Card>
      ) : null}

      {(history.data ?? []).length > 0 ? (
        <Card>
          <CardHeader>
            <h2 className="font-serif text-2xl text-navy">External status history</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {(history.data ?? []).map((entry) => (
              <div key={entry.id} className="border-b border-border/70 pb-3 last:border-0 last:pb-0">
                <p className="text-sm font-medium text-navy">{entry.status_label}</p>
                <p className="text-xs text-muted">
                  {formatDate(entry.checked_at)} · {entry.source_label}
                  {entry.updated_by_name ? ` · ${entry.updated_by_name}` : ""}
                </p>
                {entry.note ? <p className="mt-1 text-sm text-charcoal">{entry.note}</p> : null}
              </div>
            ))}
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
