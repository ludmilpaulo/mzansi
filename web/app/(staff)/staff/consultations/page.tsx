"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { ErrorState } from "@/components/ui/ErrorState";
import { formatDateTime } from "@/lib/dates";
import { getErrorMessage } from "@/lib/errors";
import { useConfirmAppointmentMutation, useGetAppointmentsQuery } from "@/store/api";
import type { Appointment } from "@/types/api";

export default function StaffConsultationsPage() {
  const query = useGetAppointmentsQuery();
  const [confirm, request] = useConfirmAppointmentMutation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl text-navy">Consultations</h1>
        <p className="mt-1 text-sm text-muted">Confirm bookings and share a meeting link when ready.</p>
      </div>
      {request.isError ? <p className="text-sm text-red-600">{getErrorMessage(request.error)}</p> : null}
      {query.isError ? (
        <ErrorState description={getErrorMessage(query.error)} />
      ) : (
        <Card>
          <DataTable<Appointment>
            loading={query.isLoading}
            rows={query.data?.results ?? []}
            rowKey={(row) => row.id}
            emptyTitle="No consultations"
            columns={[
              { key: "when", header: "When", render: (row) => formatDateTime(row.starts_at) },
              { key: "client", header: "Client", render: (row) => row.client_name },
              { key: "consultant", header: "Consultant", render: (row) => row.consultant_name },
              { key: "type", header: "Type", render: (row) => row.consultation_type.name },
              { key: "status", header: "Status", render: (row) => <Badge>{row.status}</Badge> },
              {
                key: "act",
                header: "",
                render: (row) =>
                  row.status === "PENDING" ? (
                    <Button type="button" size="sm" disabled={request.isLoading} onClick={() => void confirm({ id: row.id })}>
                      Confirm
                    </Button>
                  ) : null,
              },
            ]}
          />
        </Card>
      )}
    </div>
  );
}
