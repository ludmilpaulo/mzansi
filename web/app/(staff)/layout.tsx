import type { ReactNode } from "react";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { StaffShell } from "@/components/staff/StaffShell";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allow="staff">
      <StaffShell>{children}</StaffShell>
    </RoleGuard>
  );
}
