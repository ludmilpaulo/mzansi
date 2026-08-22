"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { formatCents, invoiceStatusLabel } from "@/lib/format";
import { getErrorMessage } from "@/lib/errors";
import { isFinanceRole } from "@/lib/roles";
import {
  useCreateInvoiceMutation,
  useGetAuditQuery,
  useGetInvoicesQuery,
  useGetReportsDashboardQuery,
  useRecordInvoicePaymentMutation,
} from "@/store/api";
import { useAppSelector } from "@/store/hooks";
import type { AuditLog, Invoice } from "@/types/api";

const PIE_COLORS = ["#FF6B21", "#0F172A", "#1A1A1A", "#F59E0B", "#15803D", "#1D4ED8"];

export default function StaffReportsPage() {
  const user = useAppSelector((state) => state.auth.user);
  const finance = isFinanceRole(user?.role);
  const stats = useGetReportsDashboardQuery();
  const invoices = useGetInvoicesQuery();
  const audit = useGetAuditQuery();
  const [createInvoice, createReq] = useCreateInvoiceMutation();
  const [recordPayment, payReq] = useRecordInvoicePaymentMutation();
  const [clientId, setClientId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  if (stats.isLoading) {
    return <Spinner className="min-h-[40vh]" />;
  }
  if (stats.isError || !stats.data) {
    return <ErrorState description={getErrorMessage(stats.error)} />;
  }

  const byService = stats.data.applications_by_service.map((item) => ({
    name: item.service__name,
    count: item.count,
  }));
  const byStatus = stats.data.applications_by_status.map((item) => ({
    name: item.status__label,
    value: item.count,
  }));
  const clientsOverTime = stats.data.new_clients.map((item) => ({
    month: item.month ? item.month.slice(0, 7) : "—",
    count: item.count,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl text-navy">Reports</h1>
        <p className="mt-1 text-sm text-muted">Pipeline analytics and finance records. Approval rates are not a marketing claim.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-serif text-2xl text-navy">By service</h2>
          </CardHeader>
          <CardBody className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byService}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" hide />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0F172A" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-serif text-2xl text-navy">By status</h2>
          </CardHeader>
          <CardBody className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                  {byStatus.map((entry, index) => (
                    <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length] ?? "#FF6B21"} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <h2 className="font-serif text-2xl text-navy">New clients</h2>
        </CardHeader>
        <CardBody className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={clientsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#FF6B21" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {finance ? (
        <Card>
          <CardHeader>
            <h2 className="font-serif text-2xl text-navy">Invoices</h2>
          </CardHeader>
          <CardBody className="space-y-6">
            <form
              className="grid gap-3 md:grid-cols-3"
              onSubmit={(event) => {
                event.preventDefault();
                void createInvoice({
                  client: Number(clientId),
                  description,
                  amount_cents: Math.round(Number(amount) * 100),
                  currency: "ZAR",
                  status: "ISSUED",
                });
              }}
            >
              <Input label="Client ID" value={clientId} onChange={(event) => setClientId(event.target.value)} />
              <Input label="Amount (ZAR)" value={amount} onChange={(event) => setAmount(event.target.value)} />
              <Input label="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
              <div className="md:col-span-3">
                {createReq.isError ? <p className="mb-2 text-sm text-red-600">{getErrorMessage(createReq.error)}</p> : null}
                <Button type="submit" disabled={createReq.isLoading}>
                  Issue invoice
                </Button>
              </div>
            </form>
            <DataTable<Invoice>
              loading={invoices.isLoading}
              rows={invoices.data?.results ?? []}
              rowKey={(row) => row.id}
              emptyTitle="No invoices"
              columns={[
                { key: "number", header: "Number", render: (row) => row.number },
                { key: "client", header: "Client", render: (row) => row.client_name },
                { key: "amount", header: "Amount", render: (row) => row.amount },
                {
                  key: "status",
                  header: "Status",
                  render: (row) => <Badge>{invoiceStatusLabel(row.status)}</Badge>,
                },
                {
                  key: "pay",
                  header: "",
                  render: (row) =>
                    row.status === "ISSUED" || row.status === "OVERDUE" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={payReq.isLoading}
                        onClick={() =>
                          void recordPayment({
                            id: row.id,
                            body: { provider: "manual", amount_cents: row.amount_cents },
                          })
                        }
                      >
                        Record payment
                      </Button>
                    ) : (
                      formatCents(row.amount_cents, row.currency)
                    ),
                },
              ]}
            />
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <h2 className="font-serif text-2xl text-navy">Audit log</h2>
        </CardHeader>
        <CardBody>
          <DataTable<AuditLog>
            loading={audit.isLoading}
            rows={audit.data?.results ?? []}
            rowKey={(row) => row.id}
            emptyTitle="No audit events visible"
            emptyDescription="Audit access is limited to admin roles."
            columns={[
              { key: "action", header: "Action", render: (row) => row.action },
              { key: "actor", header: "Actor", render: (row) => String(row.actor ?? "—") },
              { key: "when", header: "When", render: (row) => row.created_at },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  );
}
