import type { Metadata } from "next";
import type { ReactNode } from "react";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { PortalShell } from "@/components/portal/PortalShell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allow="client">
      <PortalShell>{children}</PortalShell>
    </RoleGuard>
  );
}
