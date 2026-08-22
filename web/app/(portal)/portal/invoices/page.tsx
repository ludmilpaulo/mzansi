"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { ErrorState } from "@/components/ui/ErrorState";
import { formatDate } from "@/lib/dates";
import { invoiceStatusLabel } from "@/lib/format";
import { getErrorMessage } from "@/lib/errors";
import { useGetInvoicesQuery } from "@/store/api";
import type { Invoice, InvoiceStatus } from "@/types/api";

function tone(status: InvoiceStatus) {
  if (status === "PAID") {
    return "success" as const;
  }
  if (status === "OVERDUE") {
    return "danger" as const;
  }
  return "neutral" as const;
}

export default function PortalInvoicesPage() {
  const query = useGetInvoicesQuery();
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-4xl text-navy">Invoices</h1>
      {query.isError ? (
        <ErrorState description={getErrorMessage(query.error)} />
      ) : (
        <Card>
          <DataTable<Invoice>
            loading={query.isLoading}
            rows={query.data?.results ?? []}
            rowKey={(row) => row.id}
            emptyTitle="No invoices"
            columns={[
              { key: "number", header: "Number", render: (row) => row.number },
              { key: "desc", header: "Description", render: (row) => row.description },
              { key: "amount", header: "Amount", render: (row) => row.amount },
              { key: "status", header: "Status", render: (row) => <Badge tone={tone(row.status)}>{invoiceStatusLabel(row.status)}</Badge> },
              { key: "due", header: "Due", render: (row) => formatDate(row.due_date) },
            ]}
          />
        </Card>
      )}
    </div>
  );
}
