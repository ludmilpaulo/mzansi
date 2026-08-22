"use client";

import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/Spinner";
import { getErrorMessage } from "@/lib/errors";
import { useGetArticlesQuery, useGetFaqsQuery, useGetServicesQuery } from "@/store/api";

export default function StaffContentPage() {
  const services = useGetServicesQuery();
  const faqs = useGetFaqsQuery();
  const articles = useGetArticlesQuery();

  if (services.isLoading || faqs.isLoading || articles.isLoading) {
    return <Spinner className="min-h-[40vh]" />;
  }
  if (services.isError || faqs.isError || articles.isError) {
    return <ErrorState description={getErrorMessage(services.error ?? faqs.error ?? articles.error)} />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl text-navy">Content</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Published services, FAQs, and articles from the API. Structural edits are managed through site settings and
          the content endpoints — this view is the operational index.
        </p>
      </div>
      <Card>
        <CardHeader>
          <h2 className="font-serif text-2xl text-navy">Services</h2>
        </CardHeader>
        <CardBody className="space-y-3">
          {(services.data ?? []).length === 0 ? (
            <EmptyState title="No services" />
          ) : (
            (services.data ?? []).map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4 border-b border-border pb-3 last:border-0">
                <div>
                  <p className="font-medium text-navy">{item.name}</p>
                  <p className="text-sm text-muted">{item.short_description}</p>
                </div>
                <p className="text-xs text-muted">{item.slug}</p>
              </div>
            ))
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="font-serif text-2xl text-navy">FAQs</h2>
        </CardHeader>
        <CardBody className="space-y-3">
          {(faqs.data ?? []).map((item) => (
            <div key={item.id}>
              <p className="font-medium text-navy">{item.question}</p>
              <p className="text-sm text-muted">{item.answer}</p>
            </div>
          ))}
        </CardBody>
      </Card>
      <Card>
        <CardHeader>
          <h2 className="font-serif text-2xl text-navy">Articles</h2>
        </CardHeader>
        <CardBody className="space-y-3">
          {(articles.data?.results ?? []).map((item) => (
            <div key={item.id}>
              <p className="font-medium text-navy">{item.title}</p>
              <p className="text-sm text-muted">{item.excerpt}</p>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
