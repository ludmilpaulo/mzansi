import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white shadow-[0_10px_24px_rgba(255,107,33,0.28)] hover:bg-brand-dark hover:shadow-[0_14px_28px_rgba(255,107,33,0.34)]",
  secondary: "bg-navy text-white hover:bg-navy/90",
  ghost: "bg-transparent text-charcoal hover:bg-soft",
  danger: "bg-red-700 text-white hover:bg-red-800",
  outline: "border border-border bg-white/80 text-charcoal hover:border-brand/50 hover:text-brand",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-7 text-base",
};

interface SharedProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

type ButtonProps = SharedProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type LinkButtonProps = SharedProps & { href: string };

export function Button({ variant = "primary", size = "md", className, children, ...props }: ButtonProps | LinkButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-[13px] font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
  if ("href" in props && props.href) {
    const { href } = props;
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  const buttonProps = props as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
