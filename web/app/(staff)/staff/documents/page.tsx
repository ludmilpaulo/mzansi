"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { Textarea } from "@/components/ui/Textarea";
import { documentStatusLabel } from "@/lib/format";
import { getErrorMessage } from "@/lib/errors";
import { useGetDocumentsQuery, useReviewDocumentMutation } from "@/store/api";
import type { DocumentReviewOutcome, DocumentStatus } from "@/types/api";

export default function StaffDocumentsPage() {
  const query = useGetDocumentsQuery();
  const [review, request] = useReviewDocumentMutation();
  const [drafts, setDrafts] = useState<Record<number, { outcome: DocumentReviewOutcome; reason: string; client_visible_note: string; internal_note: string }>>({});

  function draft(id: number) {
    return drafts[id] ?? { outcome: "VERIFIED", reason: "", client_visible_note: "", internal_note: "" };
  }

  if (query.isLoading) {
    return <Spinner className="min-h-[40vh]" />;
  }
  if (query.isError) {
    return <ErrorState description={getErrorMessage(query.error)} />;
  }
  const rows = query.data?.results ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl text-navy">Document review</h1>
        <p className="mt-1 text-sm text-muted">Verify or request a replacement. Clients see only the client-facing note.</p>
      </div>
      {rows.length === 0 ? (
        <EmptyState title="No documents in the queue" />
      ) : (
        <div className="space-y-4">
          {rows.map((doc) => {
            const current = draft(doc.id);
            const canReview = doc.status === "UPLOADED" || doc.status === "UNDER_REVIEW";
            return (
              <Card key={doc.id}>
                <CardBody className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-navy">{doc.document_type.name}</p>
                      <p className="text-sm text-muted">Application #{doc.application}</p>
                      {doc.original_filename ? <p className="text-xs text-muted">{doc.original_filename}</p> : null}
                    </div>
                    <Badge>{documentStatusLabel(doc.status as DocumentStatus)}</Badge>
                  </div>
                  {canReview ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <Select
                        label="Outcome"
                        value={current.outcome}
                        onChange={(event) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [doc.id]: { ...current, outcome: event.target.value as DocumentReviewOutcome },
                          }))
                        }
                      >
                        <option value="VERIFIED">Verified</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="REPLACEMENT_REQUIRED">Replacement required</option>
                      </Select>
                      <Textarea
                        label="Reason (required if rejecting)"
                        value={current.reason}
                        onChange={(event) => setDrafts((prev) => ({ ...prev, [doc.id]: { ...current, reason: event.target.value } }))}
                      />
                      <Textarea
                        label="Note to client"
                        value={current.client_visible_note}
                        onChange={(event) =>
                          setDrafts((prev) => ({ ...prev, [doc.id]: { ...current, client_visible_note: event.target.value } }))
                        }
                      />
                      <Textarea
                        label="Internal note"
                        value={current.internal_note}
                        onChange={(event) =>
                          setDrafts((prev) => ({ ...prev, [doc.id]: { ...current, internal_note: event.target.value } }))
                        }
                      />
                      {request.isError ? <p className="text-sm text-red-600">{getErrorMessage(request.error)}</p> : null}
                      <div>
                        <Button type="button" disabled={request.isLoading} onClick={() => void review({ id: doc.id, body: current })}>
                          Save review
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
