"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/Spinner";
import { getErrorMessage } from "@/lib/errors";
import { useCreateApplicationMutation, useGetServicesQuery } from "@/store/api";

export default function NewApplicationPage() {
  const router = useRouter();
  const services = useGetServicesQuery();
  const [createApplication, request] = useCreateApplicationMutation();

  async function start(slug: string) {
    try {
      const application = await createApplication({ service: slug }).unwrap();
      router.replace(`/portal/applications/${application.id}`);
    } catch {
      // Rendered below.
    }
  }

  if (services.isLoading) {
    return <Spinner className="min-h-[40vh]" />;
  }
  if (services.isError) {
    return <ErrorState description={getErrorMessage(services.error)} />;
  }
  const list = (services.data ?? []).filter((item) => item.is_active);
  if (list.length === 0) {
    return <EmptyState title="No services available" description="Please book a consultation first." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-4xl text-navy">Start an application</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Choosing a service opens a case and a document checklist. This is not a government filing and does not
          guarantee an outcome.
        </p>
      </div>
      {request.isError ? <p className="text-sm text-red-600">{getErrorMessage(request.error)}</p> : null}
      <div className="grid gap-4">
        {list.map((service) => (
          <Card key={service.id}>
            <CardBody className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="font-serif text-2xl text-navy">{service.name}</h2>
                <p className="mt-1 text-sm text-muted">{service.short_description}</p>
              </div>
              <Button type="button" disabled={request.isLoading} onClick={() => void start(service.slug)}>
                Open this case
              </Button>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
