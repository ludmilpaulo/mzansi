"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/Spinner";
import { formatDateTime } from "@/lib/dates";
import { getErrorMessage } from "@/lib/errors";
import { useGetNotificationsQuery, useMarkAllNotificationsReadMutation, useMarkNotificationReadMutation } from "@/store/api";

export default function PortalNotificationsPage() {
  const query = useGetNotificationsQuery();
  const [markAll] = useMarkAllNotificationsReadMutation();
  const [markOne] = useMarkNotificationReadMutation();

  if (query.isLoading) {
    return <Spinner className="min-h-[40vh]" />;
  }
  if (query.isError) {
    return <ErrorState description={getErrorMessage(query.error)} />;
  }
  const rows = query.data?.results ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-4xl text-navy">Notifications</h1>
        {rows.some((item) => !item.is_read) ? (
          <Button type="button" variant="outline" size="sm" onClick={() => void markAll()}>
            Mark all read
          </Button>
        ) : null}
      </div>
      {rows.length === 0 ? (
        <EmptyState title="No notifications" />
      ) : (
        <div className="space-y-3">
          {rows.map((item) => (
            <Card key={item.id} className={item.is_read ? "" : "border-brand/30"}>
              <CardBody>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-navy">{item.title}</p>
                    <p className="mt-1 text-sm text-muted">{item.body}</p>
                    <p className="mt-2 text-xs text-muted">{formatDateTime(item.created_at)}</p>
                  </div>
                  {!item.is_read ? (
                    <Button type="button" variant="ghost" size="sm" onClick={() => void markOne(item.id)}>
                      Mark read
                    </Button>
                  ) : null}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
