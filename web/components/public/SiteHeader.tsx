"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { BrandMark } from "@/components/brand/BrandMark";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { homePathForRole } from "@/lib/roles";
import { useAppSelector } from "@/store/hooks";
import type { BrandSettings } from "@/types/api";

const LINKS = [
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/resources", label: "Resources" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({ brand }: { brand: BrandSettings }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const user = useAppSelector((state) => state.auth.user);
  const accountHref = user ? homePathForRole(user.role) : "/login";

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-[#fbfaf7]/85 backdrop-blur-xl">
      <div className="page-shell flex items-center justify-between gap-6 py-3.5">
        <BrandMark name={brand.name} />
        <nav className="hidden items-center gap-8 lg:flex">
          {LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative text-sm font-medium transition",
                  active ? "text-navy" : "text-muted hover:text-navy",
                )}
              >
                {link.label}
                {active ? <span className="absolute -bottom-2 left-0 h-0.5 w-full rounded-full bg-brand" /> : null}
              </Link>
            );
          })}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <Button href={accountHref} variant="ghost" size="sm">
            {user ? "Portal" : "Sign in"}
          </Button>
          <Button href="/contact" size="sm">
            Book a consultation
          </Button>
        </div>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-navy lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open ? (
        <div className="border-t border-border bg-[#fbfaf7] px-5 py-5 lg:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-sm font-medium text-navy hover:bg-white"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              <Button href={accountHref} variant="outline">
                {user ? "Portal" : "Sign in"}
              </Button>
              <Button href="/contact">Book a consultation</Button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
