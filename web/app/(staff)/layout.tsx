import type { Metadata } from "next";
import type { ReactNode } from "react";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { StaffShell } from "@/components/staff/StaffShell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allow="staff">
      <StaffShell>{children}</StaffShell>
    </RoleGuard>
  );
}
