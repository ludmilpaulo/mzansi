"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/Spinner";
import { formatCents } from "@/lib/format";
import { getErrorMessage } from "@/lib/errors";
import { useGetReportsDashboardQuery } from "@/store/api";

export default function StaffDashboardPage() {
  const query = useGetReportsDashboardQuery();
  if (query.isLoading) {
    return <Spinner className="min-h-[40vh]" />;
  }
  if (query.isError || !query.data) {
    return <ErrorState description={getErrorMessage(query.error)} />;
  }
  const stats = query.data;
  const monthly = stats.applications_over_time.map((item) => ({
    month: item.month ? item.month.slice(0, 7) : "—",
    count: item.count,
  }));

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Today</p>
        <h1 className="mt-2 font-serif text-4xl text-navy md:text-5xl">Operations</h1>
        <p className="mt-2 text-sm text-muted">Live figures from the case pipeline. Outcomes remain with the authorities.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat label="Clients" value={String(stats.totals.clients)} />
        <Stat label="Active applications" value={String(stats.totals.active_applications)} />
        <Stat label="Pending documents" value={String(stats.totals.pending_documents)} />
        <Stat label="Upcoming consultations" value={String(stats.totals.consultations)} />
        <Stat label="Completed cases" value={String(stats.totals.completed_applications)} />
        <Stat label="Recorded revenue" value={formatCents(stats.totals.revenue_cents)} />
        <Stat label="Outstanding invoices" value={String(stats.totals.outstanding_invoices)} />
        <Stat
          label="Doc rejection rate"
          value={`${Math.round(stats.document_verification.rejection_rate * 100)}%`}
        />
      </div>
      <Card>
        <CardHeader>
          <h2 className="font-serif text-2xl text-navy">Applications this year</h2>
        </CardHeader>
        <CardBody className="h-80">
          {monthly.length === 0 ? (
            <p className="text-sm text-muted">No applications recorded this year.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#FF6B21" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardBody className="p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
        <p className="mt-3 font-serif text-3xl text-navy">{value}</p>
      </CardBody>
    </Card>
  );
}
