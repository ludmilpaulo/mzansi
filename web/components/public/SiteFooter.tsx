import Link from "next/link";

import { BrandMark } from "@/components/brand/BrandMark";
import type { Disclaimer } from "@/lib/content";
import type { BrandSettings } from "@/types/api";

export function SiteFooter({ brand, disclaimer }: { brand: BrandSettings; disclaimer: Disclaimer | null }) {
  return (
    <footer className="border-t border-white/10 bg-navy text-white">
      <div className="page-shell grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <BrandMark name={brand.name} invert />
          {brand.tagline ? <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/65">{brand.tagline}</p> : null}
          <ul className="mt-6 space-y-2 text-sm text-white/70">
            {brand.address ? <li>{brand.address}</li> : null}
            {brand.phone ? <li>{brand.phone}</li> : null}
            {brand.email ? <li>{brand.email}</li> : null}
          </ul>
        </div>
        <div className="md:col-span-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Practice</p>
          <ul className="mt-4 space-y-2.5 text-sm text-white/75">
            <li>
              <Link href="/services" className="hover:text-white">
                Services
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-white">
                About
              </Link>
            </li>
            <li>
              <Link href="/resources" className="hover:text-white">
                Resources
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div className="md:col-span-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Clients</p>
          <ul className="mt-4 space-y-2.5 text-sm text-white/75">
            <li>
              <Link href="/login" className="hover:text-white">
                Client portal
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-white">
                Create an account
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-white">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-white">
                Terms
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-white">
                FAQ
              </Link>
            </li>
          </ul>
        </div>
      </div>
      {disclaimer ? (
        <div className="border-t border-white/10">
          <p className="page-shell py-6 text-xs leading-relaxed text-white/45">{disclaimer.text}</p>
        </div>
      ) : null}
    </footer>
  );
}
