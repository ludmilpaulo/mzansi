"use client";

import Link from "next/link";
import { Bell, Calendar, FileText } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Spinner } from "@/components/ui/Spinner";
import { getErrorMessage } from "@/lib/errors";
import { useAppSelector } from "@/store/hooks";
import { useGetAppointmentsQuery, useGetDashboardQuery, useGetNotificationsQuery } from "@/store/api";

export default function PortalHomePage() {
  const user = useAppSelector((state) => state.auth.user);
  const dashboard = useGetDashboardQuery();
  const notifications = useGetNotificationsQuery();
  const appointments = useGetAppointmentsQuery();

  if (dashboard.isLoading) {
    return <Spinner className="min-h-[40vh]" />;
  }
  if (dashboard.isError) {
    return <ErrorState description={getErrorMessage(dashboard.error)} />;
  }

  const active = dashboard.data?.active_application ?? null;
  const counts = dashboard.data?.counts;
  const unread = (notifications.data?.results ?? []).filter((item) => !item.is_read);
  const upcoming = (appointments.data?.results ?? []).find((item) => item.status === "CONFIRMED" || item.status === "PENDING");
  const firstName = user?.first_name || "there";

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Good to see you</p>
        <h1 className="mt-2 font-serif text-4xl text-navy md:text-5xl">Hello, {firstName}.</h1>
        <p className="mt-2 text-muted">Here is what needs your attention next.</p>
      </div>

      {active ? (
        <Card className="overflow-hidden border-brand/20 bg-[linear-gradient(180deg,#fff8f3_0%,#ffffff_42%)]">
          <CardBody className="space-y-5 p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Next action</p>
                <h2 className="mt-2 font-serif text-3xl text-navy">{active.next_action || "No client action is waiting right now."}</h2>
                <p className="mt-2 text-sm text-muted">
                  {active.reference} · {active.service.name}
                </p>
              </div>
              <Badge tone={active.status.client_action_required ? "warning" : "info"}>{active.status.label}</Badge>
            </div>
            <div>
              <div className="mb-2 flex justify-between text-xs text-muted">
                <span>Application progress</span>
                <span>{active.progress}%</span>
              </div>
              <ProgressBar value={active.progress} />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button href={`/portal/applications/${active.id}`}>Open application</Button>
              {active.document_counts.pending > 0 ? (
                <Button href="/portal/documents" variant="outline">
                  <FileText className="h-4 w-4" />
                  {active.document_counts.pending} document{active.document_counts.pending === 1 ? "" : "s"} waiting
                </Button>
              ) : null}
            </div>
          </CardBody>
        </Card>
      ) : (
        <EmptyState
          title="No active application"
          description="When you are ready, start an application from a published service. A consultation first is often the better path."
          action={
            <div className="flex justify-center gap-3">
              <Button href="/portal/applications/new">Start an application</Button>
              <Button href="/portal/consultations/book" variant="outline">
                Book a consultation
              </Button>
            </div>
          }
        />
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Active" value={counts?.active ?? 0} />
        <SummaryCard label="Pending" value={counts?.pending ?? 0} />
        <SummaryCard label="Completed" value={counts?.completed ?? 0} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center gap-2 text-navy">
              <Calendar className="h-4 w-4 text-brand" />
              <h2 className="font-serif text-2xl">Upcoming consultation</h2>
            </div>
            {upcoming ? (
              <div className="mt-4">
                <p className="text-sm font-medium text-navy">{upcoming.consultation_type.name}</p>
                <p className="mt-1 text-sm text-muted">
                  {new Date(upcoming.starts_at).toLocaleString()} · {upcoming.consultant_name}
                </p>
                <Button href="/portal/consultations" variant="outline" size="sm" className="mt-4">
                  View appointment
                </Button>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">No upcoming consultation. Book one when you want to talk through options.</p>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-navy">
                <Bell className="h-4 w-4 text-brand" />
                <h2 className="font-serif text-2xl">Messages</h2>
              </div>
              <Link href="/portal/notifications" className="text-sm font-semibold text-brand">
                View all
              </Link>
            </div>
            {unread.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {unread.slice(0, 3).map((item) => (
                  <li key={item.id}>
                    <p className="text-sm font-medium text-navy">{item.title}</p>
                    <p className="text-sm text-muted">{item.body}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">You are up to date. New notices will appear here.</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardBody className="p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
        <p className="mt-2 font-serif text-4xl text-navy">{value}</p>
      </CardBody>
    </Card>
  );
}
