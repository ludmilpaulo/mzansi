"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Spinner } from "@/components/ui/Spinner";
import { getErrorMessage } from "@/lib/errors";
import { asJsonObject, parseSeoDefaults } from "@/lib/seo";
import {
  useGetPublicSeoQuery,
  useUpdateArticleMutation,
  useUpdateLandingMutation,
  useUpdatePageMutation,
  useUpdateServiceMutation,
  useUpdateSiteSettingMutation,
} from "@/store/api";

export default function StaffSeoPage() {
  const seoQuery = useGetPublicSeoQuery();
  const [updateSetting, settingState] = useUpdateSiteSettingMutation();
  const [updateService] = useUpdateServiceMutation();
  const [updateArticle] = useUpdateArticleMutation();
  const [updatePage] = useUpdatePageMutation();
  const [updateLanding] = useUpdateLandingMutation();
  const [draftTitle, setDraftTitle] = useState<string | null>(null);
  const [draftDescription, setDraftDescription] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const parsedDefaults = parseSeoDefaults(seoQuery.data?.settings.seo);
  const defaultTitle = draftTitle ?? parsedDefaults.defaultTitle;
  const defaultDescription = draftDescription ?? parsedDefaults.defaultDescription;

  if (seoQuery.isLoading) {
    return <Spinner className="min-h-[40vh]" />;
  }
  if (seoQuery.isError || !seoQuery.data) {
    return <ErrorState description={getErrorMessage(seoQuery.error)} />;
  }

  const index = seoQuery.data;

  async function saveDefaults() {
    const current = asJsonObject(index.settings.seo);
    await updateSetting({
      key: "seo",
      value: { ...current, default_title: defaultTitle, default_description: defaultDescription },
    }).unwrap();
    setMessage("Site SEO defaults saved.");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl text-navy">Search</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Edit titles, descriptions and indexability from the API. Do not publish thin country copies or promise
          approval. Portuguese and French versions should be human-reviewed before they are added.
        </p>
      </div>
      {message ? <p className="text-sm text-brand">{message}</p> : null}
      <Card>
        <CardHeader>
          <h2 className="font-serif text-2xl text-navy">Site defaults</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <label className="block text-sm">
            <span className="text-muted">Default title</span>
            <input
              className="mt-1 w-full rounded-xl border border-border px-3 py-2"
              value={defaultTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted">Default description</span>
            <textarea
              className="mt-1 w-full rounded-xl border border-border px-3 py-2"
              rows={3}
              value={defaultDescription}
              onChange={(event) => setDraftDescription(event.target.value)}
            />
          </label>
          <Button type="button" onClick={() => void saveDefaults()} disabled={settingState.isLoading}>
            Save defaults
          </Button>
        </CardBody>
      </Card>
      <SeoTable
        title="Services"
        rows={index.services.map((item) => ({
          key: item.slug,
          label: item.name,
          seoTitle: item.seo_title,
          seoDescription: item.seo_description,
          robots: item.robots,
          onSave: (seoTitle, seoDescription, robots) =>
            updateService({ slug: item.slug, body: { seo_title: seoTitle, seo_description: seoDescription, robots } }).unwrap(),
        }))}
      />
      <SeoTable
        title="Guides"
        rows={index.articles.map((item) => ({
          key: item.slug,
          label: item.title,
          seoTitle: item.seo_title,
          seoDescription: item.seo_description,
          robots: item.robots,
          onSave: (seoTitle, seoDescription, robots) =>
            updateArticle({ slug: item.slug, body: { seo_title: seoTitle, seo_description: seoDescription, robots } }).unwrap(),
        }))}
      />
      <SeoTable
        title="Pages"
        rows={index.pages.map((item) => ({
          key: item.slug,
          label: item.title,
          seoTitle: item.seo_title,
          seoDescription: item.seo_description,
          robots: item.robots,
          onSave: (seoTitle, seoDescription, robots) =>
            updatePage({ slug: item.slug, body: { seo_title: seoTitle, seo_description: seoDescription, robots } }).unwrap(),
        }))}
      />
      <SeoTable
        title="Country and location pages"
        rows={index.landings.map((item) => ({
          key: item.slug,
          label: `${item.kind}: ${item.title}`,
          seoTitle: item.seo_title,
          seoDescription: item.seo_description,
          robots: item.robots,
          onSave: (seoTitle, seoDescription, robots) =>
            updateLanding({ slug: item.slug, body: { seo_title: seoTitle, seo_description: seoDescription, robots } }).unwrap(),
        }))}
      />
    </div>
  );
}

interface SeoRow {
  key: string;
  label: string;
  seoTitle: string;
  seoDescription: string;
  robots: string;
  onSave: (seoTitle: string, seoDescription: string, robots: string) => Promise<unknown>;
}

function SeoTable({ title, rows }: { title: string; rows: SeoRow[] }) {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-serif text-2xl text-navy">{title}</h2>
      </CardHeader>
      <CardBody className="space-y-6">
        {rows.map((row) => (
          <SeoRowEditor key={row.key} row={row} />
        ))}
      </CardBody>
    </Card>
  );
}

function SeoRowEditor({ row }: { row: SeoRow }) {
  const [seoTitle, setSeoTitle] = useState(row.seoTitle);
  const [seoDescription, setSeoDescription] = useState(row.seoDescription);
  const [robots, setRobots] = useState(row.robots);
  const [saving, setSaving] = useState(false);

  return (
    <div className="border-b border-border pb-4 last:border-0">
      <p className="font-medium text-navy">{row.label}</p>
      <p className="text-xs text-muted">{row.key}</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <input
          className="rounded-xl border border-border px-3 py-2 text-sm"
          value={seoTitle}
          onChange={(event) => setSeoTitle(event.target.value)}
          placeholder="SEO title"
        />
        <select className="rounded-xl border border-border px-3 py-2 text-sm" value={robots} onChange={(event) => setRobots(event.target.value)}>
          <option value="index,follow">index, follow</option>
          <option value="noindex,nofollow">noindex, nofollow</option>
        </select>
      </div>
      <textarea
        className="mt-3 w-full rounded-xl border border-border px-3 py-2 text-sm"
        rows={2}
        value={seoDescription}
        onChange={(event) => setSeoDescription(event.target.value)}
        placeholder="Meta description"
      />
      <button
        type="button"
        className="mt-2 text-sm font-semibold text-brand"
        disabled={saving}
        onClick={() => {
          setSaving(true);
          void row.onSave(seoTitle, seoDescription, robots).finally(() => setSaving(false));
        }}
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
