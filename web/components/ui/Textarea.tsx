import { forwardRef, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, className, id, ...props },
  ref,
) {
  const inputId = id ?? props.name;
  return (
    <label className="block space-y-1.5" htmlFor={inputId}>
      {label ? <span className="text-sm font-medium text-charcoal">{label}</span> : null}
      <textarea
        id={inputId}
        ref={ref}
        className={cn(
          "min-h-28 w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-charcoal outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/20",
          error ? "border-red-400" : "border-border",
          className,
        )}
        {...props}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
});
