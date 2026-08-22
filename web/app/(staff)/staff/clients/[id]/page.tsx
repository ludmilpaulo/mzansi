"use client";

import { useParams } from "next/navigation";

import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Spinner } from "@/components/ui/Spinner";
import { formatDateTime } from "@/lib/dates";
import { getErrorMessage } from "@/lib/errors";
import { useGetClientActivityQuery, useGetClientQuery } from "@/store/api";

export default function StaffClientDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const client = useGetClientQuery(id, { skip: !id });
  const activity = useGetClientActivityQuery(id, { skip: !id });

  if (client.isLoading) {
    return <Spinner className="min-h-[40vh]" />;
  }
  if (client.isError || !client.data) {
    return <ErrorState description={getErrorMessage(client.error, "Client not found.")} />;
  }
  const person = client.data;
  const profile = person.client_profile;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl text-navy">{person.full_name}</h1>
        <p className="mt-1 text-sm text-muted">
          {person.email} · {person.phone}
        </p>
      </div>
      {profile ? (
        <Card>
          <CardHeader>
            <h2 className="font-serif text-2xl text-navy">Profile</h2>
          </CardHeader>
          <CardBody className="space-y-3 text-sm">
            <ProgressBar value={profile.completion_percent} />
            <p>Nationality: {profile.nationality || "—"}</p>
            <p>Current country: {profile.current_country || "—"}</p>
            <p>Passport: {profile.passport_number || "—"}</p>
            <p>Occupation: {profile.occupation || "—"}</p>
            {profile.profile_notes ? <p className="text-muted">{profile.profile_notes}</p> : null}
          </CardBody>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <h2 className="font-serif text-2xl text-navy">Recent activity</h2>
        </CardHeader>
        <CardBody className="space-y-3">
          {(activity.data ?? []).map((event) => (
            <div key={event.id} className="text-sm">
              <p className="text-navy">{event.action}</p>
              <p className="text-xs text-muted">
                {event.actor_email} · {formatDateTime(event.created_at)}
              </p>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
