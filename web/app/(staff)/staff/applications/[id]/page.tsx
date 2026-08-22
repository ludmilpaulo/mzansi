"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { Textarea } from "@/components/ui/Textarea";
import { Timeline } from "@/components/ui/Timeline";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/dates";
import { documentStatusLabel } from "@/lib/format";
import { getErrorMessage } from "@/lib/errors";
import {
  useAddApplicationNoteMutation,
  useAssignApplicationMutation,
  useCreateDocumentRequestMutation,
  useGetApplicationQuery,
  useGetApplicationStatusesQuery,
  useGetConversationsQuery,
  useGetDocumentTypesQuery,
  useGetDocumentsQuery,
  useGetMessagesQuery,
  useGetStaffDirectoryQuery,
  useSendMessageMutation,
  useTransitionApplicationMutation,
} from "@/store/api";
import { useAppSelector } from "@/store/hooks";

export default function StaffApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const application = useGetApplicationQuery(id, { skip: !id });
  const documents = useGetDocumentsQuery({ application: id }, { skip: !id });
  const statuses = useGetApplicationStatusesQuery();
  const staff = useGetStaffDirectoryQuery();
  const conversations = useGetConversationsQuery();
  const types = useGetDocumentTypesQuery();
  const [transition, transitionReq] = useTransitionApplicationMutation();
  const [assign, assignReq] = useAssignApplicationMutation();
  const [addNote, noteReq] = useAddApplicationNoteMutation();
  const [requestDoc, requestReq] = useCreateDocumentRequestMutation();
  const [statusCode, setStatusCode] = useState("");
  const [note, setNote] = useState("");
  const [consultantId, setConsultantId] = useState("");
  const [reviewerId, setReviewerId] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [visibleNote, setVisibleNote] = useState(false);
  const [docTypeId, setDocTypeId] = useState("");
  const [docDescription, setDocDescription] = useState("");

  const conversation = useMemo(
    () => (conversations.data?.results ?? []).find((item) => item.application === id),
    [conversations.data, id],
  );
  const messages = useGetMessagesQuery(conversation?.id ?? 0, { skip: !conversation });
  const [send, sendReq] = useSendMessageMutation();
  const [messageBody, setMessageBody] = useState("");
  const user = useAppSelector((state) => state.auth.user);

  if (application.isLoading) {
    return <Spinner className="min-h-[40vh]" />;
  }
  if (application.isError || !application.data) {
    return <ErrorState description={getErrorMessage(application.error, "Case not found.")} />;
  }
  const item = application.data;
  const directory = staff.data?.results ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{item.reference}</p>
          <h1 className="font-serif text-4xl text-navy">{item.service.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {item.client_name} · {item.client_email}
          </p>
        </div>
        <Badge>{item.status.label}</Badge>
      </div>
      <Card>
        <CardBody className="space-y-3">
          <p className="text-sm">{item.next_action || "No next action recorded."}</p>
          <ProgressBar value={item.progress} />
        </CardBody>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-serif text-2xl text-navy">Transition</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <Select value={statusCode} onChange={(event) => setStatusCode(event.target.value)} label="New status">
              <option value="">Select status</option>
              {(statuses.data ?? []).map((status) => (
                <option key={status.id} value={status.code}>
                  {status.label}
                </option>
              ))}
            </Select>
            <Textarea label="Note" value={note} onChange={(event) => setNote(event.target.value)} />
            {transitionReq.isError ? <p className="text-sm text-red-600">{getErrorMessage(transitionReq.error)}</p> : null}
            <Button
              type="button"
              disabled={!statusCode || transitionReq.isLoading}
              onClick={() => void transition({ id, body: { status_code: statusCode, note } })}
            >
              Update status
            </Button>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-serif text-2xl text-navy">Assignment</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <Select label="Consultant" value={consultantId} onChange={(event) => setConsultantId(event.target.value)}>
              <option value="">{item.consultant_name ?? "Unassigned"}</option>
              {directory.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.full_name} · {person.role}
                </option>
              ))}
            </Select>
            <Select label="Reviewer" value={reviewerId} onChange={(event) => setReviewerId(event.target.value)}>
              <option value="">{item.reviewer_name ?? "Unassigned"}</option>
              {directory.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.full_name} · {person.role}
                </option>
              ))}
            </Select>
            {assignReq.isError ? <p className="text-sm text-red-600">{getErrorMessage(assignReq.error)}</p> : null}
            <Button
              type="button"
              disabled={assignReq.isLoading}
              onClick={() =>
                void assign({
                  id,
                  body: {
                    consultant_id: consultantId ? Number(consultantId) : undefined,
                    reviewer_id: reviewerId ? Number(reviewerId) : undefined,
                  },
                })
              }
            >
              Save assignment
            </Button>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-serif text-2xl text-navy">Timeline</h2>
        </CardHeader>
        <CardBody>
          <Timeline events={item.timeline} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-serif text-2xl text-navy">Documents</h2>
        </CardHeader>
        <CardBody className="space-y-3">
          {(documents.data?.results ?? []).map((doc) => (
            <div key={doc.id} className="flex items-center justify-between gap-3 text-sm">
              <span>{doc.document_type.name}</span>
              <Badge>{documentStatusLabel(doc.status)}</Badge>
            </div>
          ))}
          <div className="grid gap-3 border-t border-border pt-4 md:grid-cols-2">
            <Select label="Request document" value={docTypeId} onChange={(event) => setDocTypeId(event.target.value)}>
              <option value="">Document type</option>
              {(types.data ?? []).map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </Select>
            <Input label="Description" value={docDescription} onChange={(event) => setDocDescription(event.target.value)} />
          </div>
          {requestReq.isError ? <p className="text-sm text-red-600">{getErrorMessage(requestReq.error)}</p> : null}
          <Button
            type="button"
            variant="outline"
            disabled={!docTypeId || requestReq.isLoading}
            onClick={() =>
              void requestDoc({
                application: id,
                document_type_id: Number(docTypeId),
                description: docDescription,
                is_required: true,
                notify_email: true,
                notify_push: false,
                notify_in_app: true,
              })
            }
          >
            Request document
          </Button>
        </CardBody>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-serif text-2xl text-navy">Notes</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {item.notes.map((entry) => (
              <div key={entry.id}>
                <p className="text-sm">{entry.body}</p>
                <p className="text-xs text-muted">
                  {entry.author_name} · {formatDateTime(entry.created_at)}
                  {entry.is_visible_to_client ? " · Visible to client" : " · Internal"}
                </p>
              </div>
            ))}
            <Textarea label="Add note" value={noteBody} onChange={(event) => setNoteBody(event.target.value)} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={visibleNote} onChange={(event) => setVisibleNote(event.target.checked)} />
              Visible to client
            </label>
            {noteReq.isError ? <p className="text-sm text-red-600">{getErrorMessage(noteReq.error)}</p> : null}
            <Button
              type="button"
              disabled={!noteBody || noteReq.isLoading}
              onClick={() => void addNote({ id, body: { body: noteBody, is_visible_to_client: visibleNote } })}
            >
              Add note
            </Button>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-serif text-2xl text-navy">Messages</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            {!conversation ? (
              <p className="text-sm text-muted">No conversation is attached to this case yet.</p>
            ) : (
              <>
                {(messages.data ?? []).map((message) => (
                  <div
                    key={message.id}
                    className={cn("rounded-xl px-3 py-2 text-sm", message.sender === user?.id ? "bg-soft" : "bg-surface")}
                  >
                    <p className="text-xs text-muted">
                      {message.sender_name} · {formatDateTime(message.created_at)}
                    </p>
                    <p>{message.body}</p>
                  </div>
                ))}
                <Textarea value={messageBody} onChange={(event) => setMessageBody(event.target.value)} />
                {sendReq.isError ? <p className="text-sm text-red-600">{getErrorMessage(sendReq.error)}</p> : null}
                <Button
                  type="button"
                  disabled={!messageBody || sendReq.isLoading}
                  onClick={() => void send({ id: conversation.id, body: { body: messageBody } })}
                >
                  Send
                </Button>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
