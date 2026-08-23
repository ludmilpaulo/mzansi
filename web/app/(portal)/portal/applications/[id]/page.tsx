"use client";

import { useParams } from "next/navigation";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Spinner } from "@/components/ui/Spinner";
import { Timeline } from "@/components/ui/Timeline";
import { formatDate } from "@/lib/dates";
import { documentStatusLabel } from "@/lib/format";
import { getErrorMessage } from "@/lib/errors";
import { useGetApplicationQuery, useGetDocumentsQuery } from "@/store/api";

export default function PortalApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const application = useGetApplicationQuery(id, { skip: !id });
  const documents = useGetDocumentsQuery({ application: id }, { skip: !id });

  if (application.isLoading) {
    return <Spinner className="min-h-[40vh]" />;
  }
  if (application.isError || !application.data) {
    return <ErrorState description={getErrorMessage(application.error, "Application not found.")} />;
  }
  const item = application.data;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{item.reference}</p>
          <h1 className="font-serif text-4xl text-navy">{item.service.name}</h1>
          <p className="mt-2 text-sm text-muted">Opened {formatDate(item.created_at)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={item.status.client_action_required ? "warning" : "info"}>{item.status.label}</Badge>
          {item.external_tracking?.status_label ? <Badge tone="brand">{item.external_tracking.status_label}</Badge> : null}
        </div>
      </div>
      <Card>
        <CardBody className="space-y-3">
          <p className="text-sm font-medium text-navy">What you need to do next</p>
          <p className="text-sm text-charcoal">{item.next_action || "Nothing is waiting on you right now."}</p>
          <ProgressBar value={item.progress} />
          <div className="grid gap-3 pt-2 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Mzansi case status</p>
              <p className="mt-1 text-sm text-navy">{item.status.label}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">VFS / DHA status</p>
              <p className="mt-1 text-sm text-navy">{item.external_tracking?.status_label || "Not linked yet"}</p>
            </div>
          </div>
          <Button href={`/portal/applications/${item.id}/tracking`} variant="outline" size="sm">
            View full tracking
          </Button>
        </CardBody>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-serif text-2xl text-navy">Timeline</h2>
          </CardHeader>
          <CardBody>
            <Timeline events={item.timeline} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="font-serif text-2xl text-navy">Documents</h2>
            <Button href="/portal/documents" variant="ghost" size="sm">
              Upload
            </Button>
          </CardHeader>
          <CardBody className="space-y-3">
            {(documents.data?.results ?? []).map((doc) => (
              <div key={doc.id} className="flex items-center justify-between gap-3 text-sm">
                <span>{doc.document_type.name}</span>
                <Badge>{documentStatusLabel(doc.status)}</Badge>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
      {item.notes.length > 0 ? (
        <Card>
          <CardHeader>
            <h2 className="font-serif text-2xl text-navy">Notes for you</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {item.notes.map((note) => (
              <div key={note.id}>
                <p className="text-sm text-charcoal">{note.body}</p>
                <p className="mt-1 text-xs text-muted">
                  {note.author_name} · {formatDate(note.created_at)}
                </p>
              </div>
            ))}
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
