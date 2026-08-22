"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { ErrorState } from "@/components/ui/ErrorState";
import { formatDateTime } from "@/lib/dates";
import { getErrorMessage } from "@/lib/errors";
import { useGetAppointmentsQuery } from "@/store/api";
import type { Appointment } from "@/types/api";

export default function PortalConsultationsPage() {
  const query = useGetAppointmentsQuery();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl text-navy">Consultations</h1>
          <p className="mt-1 text-sm text-muted">Booked conversations with a consultant.</p>
        </div>
        <Button href="/portal/consultations/book">Book</Button>
      </div>
      {query.isError ? (
        <ErrorState description={getErrorMessage(query.error)} />
      ) : (
        <Card>
          <DataTable<Appointment>
            loading={query.isLoading}
            rows={query.data?.results ?? []}
            rowKey={(row) => row.id}
            emptyTitle="No consultations booked"
            emptyDescription="Choose a type, consultant, and open slot."
            columns={[
              { key: "type", header: "Type", render: (row) => row.consultation_type.name },
              { key: "when", header: "When", render: (row) => formatDateTime(row.starts_at) },
              { key: "who", header: "Consultant", render: (row) => row.consultant_name },
              { key: "status", header: "Status", render: (row) => <Badge>{row.status}</Badge> },
            ]}
          />
        </Card>
      )}
    </div>
  );
}
