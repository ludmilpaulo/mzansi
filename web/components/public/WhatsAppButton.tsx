"use client";

import { MessageCircle } from "lucide-react";

import { trackEvent } from "@/lib/analytics";
import { whatsappHref } from "@/lib/content";

export function WhatsAppButton({ whatsapp }: { whatsapp: string }) {
  const href = whatsappHref(whatsapp);
  if (!href) {
    return null;
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent({ name: "whatsapp_clicked" })}
      className="fixed bottom-20 right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_12px_28px_rgba(37,211,102,0.35)] transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 md:bottom-6 md:right-6"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
