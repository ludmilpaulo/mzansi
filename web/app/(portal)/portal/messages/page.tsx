"use client";

import Link from "next/link";

import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/Spinner";
import { formatDateTime } from "@/lib/dates";
import { getErrorMessage } from "@/lib/errors";
import { useGetConversationsQuery } from "@/store/api";

export default function PortalMessagesPage() {
  const query = useGetConversationsQuery();
  if (query.isLoading) {
    return <Spinner className="min-h-[40vh]" />;
  }
  if (query.isError) {
    return <ErrorState description={getErrorMessage(query.error)} />;
  }
  const rows = query.data?.results ?? [];
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-4xl text-navy">Messages</h1>
      {rows.length === 0 ? (
        <EmptyState title="No conversations yet" description="Messages appear once an application is opened." />
      ) : (
        <div className="space-y-3">
          {rows.map((item) => (
            <Link key={item.id} href={`/portal/messages/${item.id}`}>
              <Card className="hover:border-brand/40">
                <CardBody className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-navy">{item.subject || item.application_reference}</p>
                    <p className="mt-1 text-sm text-muted">{item.last_message?.body ?? "No messages yet"}</p>
                  </div>
                  <div className="text-right text-xs text-muted">
                    <p>{formatDateTime(item.updated_at)}</p>
                    {item.unread_count > 0 ? <p className="mt-1 text-brand">{item.unread_count} unread</p> : null}
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
