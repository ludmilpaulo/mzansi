"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Card } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { formatDate } from "@/lib/dates";
import { getErrorMessage } from "@/lib/errors";
import { useGetClientsQuery } from "@/store/api";
import type { StaffClient } from "@/types/api";

export default function StaffClientsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const query = useGetClientsQuery(search ? { search } : undefined);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl text-navy">Clients</h1>
        <p className="mt-1 text-sm text-muted">People with a client profile in this practice.</p>
      </div>
      <Input placeholder="Search name, email, phone" value={search} onChange={(event) => setSearch(event.target.value)} />
      {query.isError ? (
        <ErrorState description={getErrorMessage(query.error)} />
      ) : (
        <Card>
          <DataTable<StaffClient>
            loading={query.isLoading}
            rows={query.data?.results ?? []}
            rowKey={(row) => row.id}
            emptyTitle="No clients match"
            onRowClick={(row) => router.push(`/staff/clients/${row.id}`)}
            columns={[
              { key: "name", header: "Name", render: (row) => row.full_name },
              { key: "email", header: "Email", render: (row) => row.email },
              { key: "phone", header: "Phone", render: (row) => row.phone || "—" },
              { key: "joined", header: "Joined", render: (row) => formatDate(row.date_joined) },
            ]}
          />
        </Card>
      )}
    </div>
  );
}
