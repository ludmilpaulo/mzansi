"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/Spinner";
import { documentStatusLabel } from "@/lib/format";
import { getErrorMessage } from "@/lib/errors";
import { useGetDocumentsQuery, useUploadDocumentMutation } from "@/store/api";
import type { DocumentStatus } from "@/types/api";

function toneFor(status: DocumentStatus) {
  switch (status) {
    case "VERIFIED":
      return "success" as const;
    case "REJECTED":
    case "REPLACEMENT_REQUIRED":
    case "EXPIRED":
      return "danger" as const;
    case "UNDER_REVIEW":
    case "UPLOADED":
      return "info" as const;
    default:
      return "warning" as const;
  }
}

export default function PortalDocumentsPage() {
  const documents = useGetDocumentsQuery();
  const [upload, request] = useUploadDocumentMutation();
  const [activeId, setActiveId] = useState<number | null>(null);

  async function onFile(id: number, file: File | undefined) {
    if (!file) {
      return;
    }
    setActiveId(id);
    try {
      await upload({ id, file }).unwrap();
    } catch {
      // Rendered below.
    } finally {
      setActiveId(null);
    }
  }

  if (documents.isLoading) {
    return <Spinner className="min-h-[40vh]" />;
  }
  if (documents.isError) {
    return <ErrorState description={getErrorMessage(documents.error)} />;
  }
  const rows = documents.data?.results ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl text-navy">Documents</h1>
        <p className="mt-1 text-sm text-muted">Upload only what has been requested for your case.</p>
      </div>
      {request.isError ? <p className="text-sm text-red-600">{getErrorMessage(request.error)}</p> : null}
      {rows.length === 0 ? (
        <EmptyState title="No documents requested yet" description="A checklist appears when an application is opened." />
      ) : (
        <div className="space-y-4">
          {rows.map((doc) => {
            const canUpload = doc.status === "REQUESTED" || doc.status === "REJECTED" || doc.status === "REPLACEMENT_REQUIRED";
            return (
              <Card key={doc.id}>
                <CardBody className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-navy">{doc.document_type.name}</p>
                    <p className="text-sm text-muted">{doc.document_type.description}</p>
                    {doc.rejection_reason ? <p className="mt-2 text-sm text-red-700">{doc.rejection_reason}</p> : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={toneFor(doc.status)}>{documentStatusLabel(doc.status)}</Badge>
                    {canUpload ? (
                      <label className="inline-flex">
                        <input
                          type="file"
                          className="hidden"
                          onChange={(event) => void onFile(doc.id, event.target.files?.[0])}
                        />
                        <span className="inline-flex h-9 cursor-pointer items-center rounded-full bg-brand px-3 text-sm font-medium text-white">
                          {request.isLoading && activeId === doc.id ? "Uploading…" : "Upload"}
                        </span>
                      </label>
                    ) : null}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
