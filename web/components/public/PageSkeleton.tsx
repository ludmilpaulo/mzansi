export function PageSkeleton() {
  return (
    <div className="page-shell animate-pulse py-16" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading page</span>
      <div className="h-3 w-32 rounded-full bg-border" />
      <div className="mt-6 h-12 w-3/4 max-w-xl rounded-2xl bg-border" />
      <div className="mt-4 h-4 w-full max-w-lg rounded-full bg-border/80" />
      <div className="mt-3 h-4 w-2/3 max-w-md rounded-full bg-border/70" />
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-48 rounded-[1.35rem] border border-border bg-surface" />
        ))}
      </div>
    </div>
  );
}
