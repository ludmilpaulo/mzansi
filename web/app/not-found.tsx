import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col justify-center px-6 text-center">
      <p className="text-xs uppercase tracking-[0.24em] text-brand">404</p>
      <h1 className="mt-3 font-serif text-4xl text-navy">This page is not available</h1>
      <p className="mt-3 text-sm text-muted">The address may have changed, or the content is no longer published.</p>
      <div className="mt-8">
        <Button href="/">Back home</Button>
      </div>
    </div>
  );
}
