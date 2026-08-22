"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { ErrorState } from "@/components/ui/ErrorState";
import { formatDate } from "@/lib/dates";
import { getErrorMessage } from "@/lib/errors";
import { useGetApplicationsQuery } from "@/store/api";
import type { ApplicationBucket, ApplicationList } from "@/types/api";

const BUCKETS: { value: ApplicationBucket | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function PortalApplicationsPage() {
  const router = useRouter();
  const [bucket, setBucket] = useState<ApplicationBucket | "">("");
  const query = useGetApplicationsQuery(bucket ? { bucket } : undefined);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl text-navy">Applications</h1>
          <p className="mt-1 text-sm text-muted">Cases opened on your profile.</p>
        </div>
        <Button href="/portal/applications/new">New application</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {BUCKETS.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => setBucket(item.value)}
            className={`rounded-full px-3 py-1.5 text-sm ${bucket === item.value ? "bg-navy text-white" : "bg-white text-charcoal"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {query.isError ? (
        <ErrorState description={getErrorMessage(query.error)} />
      ) : (
        <Card>
          <DataTable<ApplicationList>
            loading={query.isLoading}
            rows={query.data?.results ?? []}
            rowKey={(row) => row.id}
            emptyTitle="No applications in this view"
            emptyDescription="Start from a published service when you are ready."
            onRowClick={(row) => router.push(`/portal/applications/${row.id}`)}
            columns={[
              { key: "ref", header: "Reference", render: (row) => row.reference },
              { key: "service", header: "Service", render: (row) => row.service.name },
              { key: "status", header: "Status", render: (row) => <Badge>{row.status.label}</Badge> },
              { key: "progress", header: "Progress", render: (row) => `${row.progress}%` },
              { key: "updated", header: "Updated", render: (row) => formatDate(row.updated_at) },
            ]}
          />
        </Card>
      )}
    </div>
  );
}
