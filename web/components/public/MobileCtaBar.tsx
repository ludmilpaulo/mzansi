"use client";

import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/Button";

const HIDDEN = ["/book", "/contact", "/login", "/register", "/activate"];

export function MobileCtaBar() {
  const pathname = usePathname();
  if (HIDDEN.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return null;
  }
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white/95 px-4 py-3 backdrop-blur md:hidden">
      <Button href="/book" className="w-full">
        Book a Consultation
      </Button>
    </div>
  );
}
