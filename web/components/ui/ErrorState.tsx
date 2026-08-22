import type { ReactNode } from "react";

export function ErrorState({
  title = "We could not load this page",
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-10 text-center">
      <h3 className="font-serif text-2xl text-navy">{title}</h3>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm text-red-800/80">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
