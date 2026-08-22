"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/Spinner";
import { Textarea } from "@/components/ui/Textarea";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/dates";
import { getErrorMessage } from "@/lib/errors";
import { useGetMessagesQuery, useSendMessageMutation } from "@/store/api";
import { useAppSelector } from "@/store/hooks";

export default function PortalConversationPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const user = useAppSelector((state) => state.auth.user);
  const messages = useGetMessagesQuery(id, { skip: !id });
  const [send, request] = useSendMessageMutation();
  const [body, setBody] = useState("");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim()) {
      return;
    }
    try {
      await send({ id, body: { body } }).unwrap();
      setBody("");
    } catch {
      // Rendered below.
    }
  }

  if (messages.isLoading) {
    return <Spinner className="min-h-[40vh]" />;
  }
  if (messages.isError) {
    return <ErrorState description={getErrorMessage(messages.error)} />;
  }

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-4xl text-navy">Conversation</h1>
      <Card>
        <CardBody className="space-y-4">
          {(messages.data ?? []).map((message) => {
            const mine = message.sender === user?.id;
            return (
              <div key={message.id} className={cn("max-w-xl rounded-2xl px-4 py-3", mine ? "ml-auto bg-soft" : "bg-surface")}>
                <p className="text-xs text-muted">
                  {message.sender_name ?? "System"} · {formatDateTime(message.created_at)}
                </p>
                <p className="mt-1 text-sm text-charcoal">{message.body}</p>
              </div>
            );
          })}
        </CardBody>
      </Card>
      <form className="space-y-3" onSubmit={(event) => void onSubmit(event)}>
        <Textarea label="Message" value={body} onChange={(event) => setBody(event.target.value)} />
        {request.isError ? <p className="text-sm text-red-600">{getErrorMessage(request.error)}</p> : null}
        <Button type="submit" disabled={request.isLoading}>
          Send
        </Button>
      </form>
    </div>
  );
}
