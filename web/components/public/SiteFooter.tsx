"use client";

import Link from "next/link";

import { BrandMark } from "@/components/brand/BrandMark";
import { trackEvent } from "@/lib/analytics";
import type { Disclaimer } from "@/lib/content";
import { whatsappHref } from "@/lib/content";
import type { BrandSettings, ServiceList } from "@/types/api";

export function SiteFooter({
  brand,
  disclaimer,
  services,
}: {
  brand: BrandSettings;
  disclaimer: Disclaimer | null;
  services: ServiceList[];
}) {
  const whatsapp = whatsappHref(brand.whatsapp);
  return (
    <footer className="border-t border-white/10 bg-navy text-white">
      <div className="page-shell grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-4">
          <BrandMark name={brand.name} invert />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/65">
            {brand.tagline ||
              "Professional visa and immigration assistance for clients navigating South African immigration."}
          </p>
        </div>
        <div className="md:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Services</p>
          <ul className="mt-4 space-y-2.5 text-sm text-white/75">
            {services.slice(0, 7).map((service) => (
              <li key={service.slug}>
                <Link href={`/services/${service.slug}`} className="hover:text-white">
                  {service.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/services" className="hover:text-white">
                All services
              </Link>
            </li>
          </ul>
        </div>
        <div className="md:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Company</p>
          <ul className="mt-4 space-y-2.5 text-sm text-white/75">
            <li>
              <Link href="/about" className="hover:text-white">
                About
              </Link>
            </li>
            <li>
              <Link href="/book" className="hover:text-white">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/immigration-guides" className="hover:text-white">
                Resources
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-white">
                FAQ
              </Link>
            </li>
            <li>
              <Link href="/countries" className="hover:text-white">
                Countries
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
          </ul>
        </div>
        <div className="md:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Clients</p>
          <ul className="mt-4 space-y-2.5 text-sm text-white/75">
            <li>
              <Link href="/login" className="hover:text-white">
                Client Portal
              </Link>
            </li>
            <li>
              <Link href="/login?next=/portal/applications" className="hover:text-white">
                Track Application
              </Link>
            </li>
            <li>
              <Link href="/book" className="hover:text-white">
                Book Consultation
              </Link>
            </li>
            <li>
              <Link href="/login?next=/portal/documents" className="hover:text-white">
                Upload Documents
              </Link>
            </li>
          </ul>
        </div>
        <div className="md:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Contact</p>
          <ul className="mt-4 space-y-2.5 text-sm text-white/75">
            {brand.phone ? (
              <li>
                <a href={`tel:${brand.phone.replaceAll(" ", "")}`} onClick={() => trackEvent({ name: "phone_clicked" })}>
                  {brand.phone}
                </a>
              </li>
            ) : null}
            {brand.email ? (
              <li>
                <a href={`mailto:${brand.email}`}>{brand.email}</a>
              </li>
            ) : null}
            {whatsapp ? (
              <li>
                <a href={whatsapp} onClick={() => trackEvent({ name: "whatsapp_clicked" })} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
              </li>
            ) : null}
            {brand.address ? <li>{brand.address}</li> : null}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="page-shell flex flex-col gap-3 py-6 text-xs leading-relaxed text-white/45 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {brand.name}</p>
          <p>
            {disclaimer?.text ??
              "Professional immigration assistance. Government decisions remain with the relevant authorities."}
          </p>
        </div>
      </div>
    </footer>
  );
}
