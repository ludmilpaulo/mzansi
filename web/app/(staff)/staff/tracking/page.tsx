"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { formatDateTime } from "@/lib/dates";
import { getErrorMessage } from "@/lib/errors";
import { parseExternalTrackingSettings } from "@/lib/tracking";
import {
  useGetExternalTrackingAdminQuery,
  useGetSiteSettingQuery,
  useRefreshApplicationTrackingMutation,
  useUpdateSiteSettingMutation,
} from "@/store/api";
import { useAppSelector } from "@/store/hooks";
import type { ExternalTrackingAdminRow } from "@/types/api";

function TrackingAdmin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const list = useGetExternalTrackingAdminQuery({
    search: search || undefined,
    page: page > 1 ? page : undefined,
  });
  const setting = useGetSiteSettingQuery("external_tracking");
  const [saveSetting, saveReq] = useUpdateSiteSettingMutation();
  const [refresh, refreshReq] = useRefreshApplicationTrackingMutation();
  const role = useAppSelector((state) => state.auth.user?.role);
  const canConfigure = role === "ADMIN" || role === "SUPER_ADMIN";
  const parsed = parseExternalTrackingSettings(setting.data?.value);
  const [automatic, setAutomatic] = useState<boolean | null>(null);
  const [intervalHours, setIntervalHours] = useState("");
  const [cooldown, setCooldown] = useState("");
  const [fallback, setFallback] = useState("");

  const automaticValue = automatic ?? parsed.automatic_tracking;
  const intervalValue = intervalHours || String(parsed.automatic_check_interval_hours);
  const cooldownValue = cooldown || String(parsed.manual_refresh_cooldown_minutes);
  const fallbackValue = fallback || parsed.fallback_url;

  const columns = useMemo(
    () => [
      { key: "client", header: "Client", render: (row: ExternalTrackingAdminRow) => row.client_name },
      { key: "app", header: "Application", render: (row: ExternalTrackingAdminRow) => row.application_reference },
      { key: "vfs", header: "VFS reference", render: (row: ExternalTrackingAdminRow) => row.reference_number || "—" },
      {
        key: "status",
        header: "External status",
        render: (row: ExternalTrackingAdminRow) => <Badge>{row.status_label || "Not recorded"}</Badge>,
      },
      { key: "checked", header: "Last checked", render: (row: ExternalTrackingAdminRow) => formatDateTime(row.checked_at) },
      { key: "health", header: "Tracking health", render: (row: ExternalTrackingAdminRow) => row.health_label },
      {
        key: "actions",
        header: "Actions",
        render: (row: ExternalTrackingAdminRow) => (
          <div className="flex flex-wrap gap-2">
            <Button href={`/staff/applications/${row.id}`} variant="ghost" size="sm">
              View
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={refreshReq.isLoading}
              onClick={(event) => {
                event.stopPropagation();
                void refresh(row.id);
              }}
            >
              Refresh
            </Button>
          </div>
        ),
      },
    ],
    [refresh, refreshReq.isLoading],
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl text-navy">External application tracking</h1>
        <p className="mt-2 text-sm text-muted">
          VFS Global does not publish an authorised South Africa tracking API. Automatic refresh stays off unless official
          credentials are configured on the server.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-serif text-2xl text-navy">Tracking configuration</h2>
        </CardHeader>
        <CardBody className="grid gap-4 md:grid-cols-2">
          <Input label="Tracking provider" value={parsed.provider} readOnly />
          <Input
            label="Automatic check interval (hours)"
            value={intervalValue}
            readOnly={!canConfigure}
            onChange={(event) => setIntervalHours(event.target.value)}
          />
          <Input
            label="Manual refresh cooldown (minutes)"
            value={cooldownValue}
            readOnly={!canConfigure}
            onChange={(event) => setCooldown(event.target.value)}
          />
          <Input
            label="Official VFS fallback URL"
            value={fallbackValue}
            readOnly={!canConfigure}
            onChange={(event) => setFallback(event.target.value)}
          />
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={automaticValue}
              disabled={!canConfigure}
              onChange={(event) => setAutomatic(event.target.checked)}
            />
            Automatic tracking (only used when an official API is configured)
          </label>
          {saveReq.isError ? <p className="text-sm text-red-600 md:col-span-2">{getErrorMessage(saveReq.error)}</p> : null}
          {canConfigure ? (
            <div className="md:col-span-2">
              <Button
                type="button"
                disabled={saveReq.isLoading}
                onClick={() =>
                  void saveSetting({
                    key: "external_tracking",
                    value: {
                      ...parsed,
                      automatic_tracking: automaticValue,
                      automatic_check_interval_hours: Number(intervalValue) || 6,
                      manual_refresh_cooldown_minutes: Number(cooldownValue) || 30,
                      fallback_url: fallbackValue,
                    },
                    description: setting.data?.description,
                  })
                }
              >
                Save configuration
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted md:col-span-2">Only administrators can change these settings.</p>
          )}
        </CardBody>
      </Card>

      {list.isError ? <ErrorState description={getErrorMessage(list.error)} /> : null}
      <Card>
        <DataTable<ExternalTrackingAdminRow>
          loading={list.isLoading}
          rows={list.data?.results ?? []}
          rowKey={(row) => row.id}
          emptyTitle="No linked VFS references"
          emptyDescription="Add a VFS reference on an application to start tracking."
          onRowClick={(row) => router.push(`/staff/applications/${row.id}`)}
          columns={columns}
        />
      </Card>
    </div>
  );
}

export default function StaffTrackingPage() {
  return (
    <Suspense fallback={<Spinner className="min-h-[40vh]" />}>
      <TrackingAdmin />
    </Suspense>
  );
}
