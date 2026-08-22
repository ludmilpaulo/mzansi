"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { formatDate } from "@/lib/dates";
import { getErrorMessage } from "@/lib/errors";
import { useGetApplicationsQuery } from "@/store/api";
import type { ApplicationList, StaffApplicationBucket } from "@/types/api";

const BUCKETS: { value: "" | StaffApplicationBucket; label: string }[] = [
  { value: "", label: "All" },
  { value: "new", label: "New" },
  { value: "in_progress", label: "In progress" },
  { value: "awaiting_client", label: "Awaiting client" },
  { value: "documents_review", label: "Documents review" },
  { value: "submitted", label: "Submitted" },
  { value: "completed", label: "Completed" },
];

function ApplicationsTable() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const bucket = searchParams.get("bucket") ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const query = useGetApplicationsQuery({
    search: search || undefined,
    bucket: bucket || undefined,
    page: page > 1 ? page : undefined,
  });

  function update(next: { search?: string; bucket?: string; page?: number }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.search !== undefined) {
      if (next.search) params.set("search", next.search);
      else params.delete("search");
      params.delete("page");
    }
    if (next.bucket !== undefined) {
      if (next.bucket) params.set("bucket", next.bucket);
      else params.delete("bucket");
      params.delete("page");
    }
    if (next.page !== undefined) {
      if (next.page > 1) params.set("page", String(next.page));
      else params.delete("page");
    }
    router.replace(`/staff/applications?${params.toString()}`);
  }

  const count = query.data?.count ?? 0;
  const hasNext = Boolean(query.data?.next);
  const hasPrev = Boolean(query.data?.previous);

  const columns = useMemo(
    () => [
      { key: "ref", header: "Reference", render: (row: ApplicationList) => row.reference },
      { key: "client", header: "Client", render: (row: ApplicationList) => `${row.client_name}` },
      { key: "service", header: "Service", render: (row: ApplicationList) => row.service.name },
      { key: "status", header: "Status", render: (row: ApplicationList) => <Badge>{row.status.label}</Badge> },
      { key: "consultant", header: "Consultant", render: (row: ApplicationList) => row.consultant_name ?? "—" },
      { key: "progress", header: "Progress", render: (row: ApplicationList) => `${row.progress}%` },
      { key: "updated", header: "Updated", render: (row: ApplicationList) => formatDate(row.updated_at) },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl text-navy">Applications</h1>
        <p className="mt-1 text-sm text-muted">{count} cases in this view.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_220px]">
        <Input
          placeholder="Search reference, client, service"
          defaultValue={search}
          onBlur={(event) => update({ search: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              update({ search: event.currentTarget.value });
            }
          }}
        />
        <Select value={bucket} onChange={(event) => update({ bucket: event.target.value })}>
          {BUCKETS.map((item) => (
            <option key={item.label} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
      </div>
      {query.isError ? (
        <ErrorState description={getErrorMessage(query.error)} />
      ) : (
        <Card>
          <DataTable<ApplicationList>
            loading={query.isLoading}
            rows={query.data?.results ?? []}
            rowKey={(row) => row.id}
            emptyTitle="No applications match these filters"
            onRowClick={(row) => router.push(`/staff/applications/${row.id}`)}
            columns={columns}
          />
        </Card>
      )}
      <div className="flex justify-end gap-3 text-sm">
        <button type="button" disabled={!hasPrev} className="disabled:opacity-40" onClick={() => update({ page: page - 1 })}>
          Previous
        </button>
        <button type="button" disabled={!hasNext} className="disabled:opacity-40" onClick={() => update({ page: page + 1 })}>
          Next
        </button>
      </div>
    </div>
  );
}

export default function StaffApplicationsPage() {
  return (
    <Suspense fallback={<Spinner className="min-h-[40vh]" />}>
      <ApplicationsTable />
    </Suspense>
  );
}
