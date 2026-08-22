"use client";

import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { formatDateTime } from "@/lib/dates";
import { getErrorMessage } from "@/lib/errors";
import { useGetInquiriesQuery, useSetInquiryStatusMutation } from "@/store/api";
import type { InquiryStatus } from "@/types/api";

const STATUSES: InquiryStatus[] = ["OPEN", "IN_PROGRESS", "WAITING_FOR_CLIENT", "RESOLVED", "CLOSED"];

export default function StaffInquiriesPage() {
  const query = useGetInquiriesQuery();
  const [setStatus, request] = useSetInquiryStatusMutation();

  if (query.isLoading) {
    return <Spinner className="min-h-[40vh]" />;
  }
  if (query.isError) {
    return <ErrorState description={getErrorMessage(query.error)} />;
  }
  const rows = query.data?.results ?? [];

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-4xl text-navy">Inquiries</h1>
      {rows.length === 0 ? (
        <EmptyState title="No inquiries" />
      ) : (
        <div className="space-y-4">
          {rows.map((item) => (
            <Card key={item.id}>
              <CardBody className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-navy">{item.subject}</p>
                    <p className="text-sm text-muted">
                      {item.client_name} · {item.category} · {formatDateTime(item.created_at)}
                    </p>
                  </div>
                  <Badge>{item.status}</Badge>
                </div>
                <p className="text-sm text-charcoal">{item.message}</p>
                <div className="flex flex-wrap items-end gap-3">
                  <Select
                    label="Status"
                    defaultValue={item.status}
                    onChange={(event) =>
                      void setStatus({ id: item.id, body: { status: event.target.value as InquiryStatus } })
                    }
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </Select>
                  {request.isError ? <p className="text-sm text-red-600">{getErrorMessage(request.error)}</p> : null}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
