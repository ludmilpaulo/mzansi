"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { BrandMark } from "@/components/brand/BrandMark";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { whatsappHref } from "@/lib/content";
import { homePathForRole, isStaffRole } from "@/lib/roles";
import { useAppSelector } from "@/store/hooks";
import type { BrandSettings } from "@/types/api";

const LINKS = [
  { href: "/services", label: "Services" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/about", label: "About Us" },
  { href: "/immigration-guides", label: "Resources" },
  { href: "/contact", label: "Contact" },
];

function locationLabel(address: string): string {
  const first = address.split(",")[0]?.trim();
  return first || address;
}

export function SiteHeader({ brand }: { brand: BrandSettings }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  const [scrolled, setScrolled] = useState(false);
  const open = menuOpen && menuPath === pathname;
  const hydrated = useAppSelector((state) => state.auth.hydrated);
  const user = useAppSelector((state) => state.auth.user);
  const accountHref = hydrated && user ? homePathForRole(user.role) : "/login";
  const trackHref =
    hydrated && user
      ? isStaffRole(user.role)
        ? "/staff/applications"
        : "/portal/applications"
      : "/login?next=/portal/applications";
  const whatsapp = whatsappHref(brand.whatsapp);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const location = brand.address ? locationLabel(brand.address) : "";

  return (
    <header className="sticky top-0 z-40" suppressHydrationWarning>
      <div className="hidden border-b border-white/10 bg-navy text-white/80 lg:block">
        <div className="page-shell flex items-center justify-between gap-6 py-2 text-[11px] font-medium tracking-wide">
          <p suppressHydrationWarning>
            South Africa Immigration Specialists
            {location ? ` · ${location}` : ""}
            <span className="text-white/45"> · Serving clients internationally</span>
          </p>
          <div className="flex items-center gap-4">
            {brand.phone ? (
              <a href={`tel:${brand.phone.replaceAll(" ", "")}`} className="hover:text-white">
                Call
              </a>
            ) : null}
            {brand.email ? (
              <a href={`mailto:${brand.email}`} className="hover:text-white">
                Email
              </a>
            ) : null}
            {whatsapp ? (
              <a href={whatsapp} className="hover:text-white" target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            ) : null}
          </div>
        </div>
      </div>
      <div
        className={cn(
          "border-b bg-white/90 backdrop-blur-xl transition-all duration-300",
          scrolled ? "border-border/80 py-0 shadow-[0_8px_24px_rgba(17,24,39,0.06)]" : "border-transparent py-1",
        )}
      >
        <div className={cn("page-shell flex items-center justify-between gap-6", scrolled ? "py-2.5" : "py-3.5")}>
          <BrandMark name={brand.name} />
          <nav className="hidden items-center gap-7 xl:flex" aria-label="Primary">
            {LINKS.map((link) => {
              const active =
                link.href !== "/#how-it-works" && (pathname === link.href || pathname.startsWith(`${link.href}/`));
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
          <div className="hidden items-center gap-2 lg:flex">
            <Button href={trackHref} variant="ghost" size="sm">
              Track Application
            </Button>
            <Button href={accountHref} variant="outline" size="sm">
              Client Portal
            </Button>
            <Button href="/book" size="sm">
              Book Consultation
            </Button>
          </div>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-[13px] border border-border bg-white text-navy lg:hidden"
            onClick={() => {
              if (open) {
                setMenuOpen(false);
              } else {
                setMenuPath(pathname);
                setMenuOpen(true);
              }
            }}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open ? (
        <div id="mobile-navigation" className="fixed inset-0 z-50 bg-white lg:hidden">
          <div className="page-shell flex items-center justify-between py-4">
            <BrandMark name={brand.name} />
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-[13px] border border-border text-navy"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="page-shell flex flex-col gap-1 pt-6" aria-label="Mobile">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-3 py-4 text-2xl font-semibold text-navy hover:bg-soft"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-8 flex flex-col gap-3">
              <Button href={trackHref} variant="outline">
                Track Application
              </Button>
              <Button href={accountHref} variant="secondary">
                Client Portal
              </Button>
              <Button href="/book">Book Consultation</Button>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
