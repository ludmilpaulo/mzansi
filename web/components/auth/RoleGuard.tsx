"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { Spinner } from "@/components/ui/Spinner";
import { isStaffRole } from "@/lib/roles";
import { useAppSelector } from "@/store/hooks";

export function RoleGuard({
  allow,
  children,
}: {
  allow: "client" | "staff";
  children: ReactNode;
}) {
  const router = useRouter();
  const hydrated = useAppSelector((state) => state.auth.hydrated);
  const access = useAppSelector((state) => state.auth.access);
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    if (!access) {
      router.replace(allow === "staff" ? "/login?next=/staff" : "/login?next=/portal");
      return;
    }
    const staff = isStaffRole(user?.role) || Boolean(user?.is_staff_role);
    if (allow === "client" && staff) {
      router.replace("/staff");
    }
    if (allow === "staff" && user && !staff) {
      router.replace("/portal");
    }
  }, [access, allow, hydrated, router, user]);

  if (!hydrated || !access) {
    return <Spinner className="min-h-[50vh]" />;
  }
  const staff = isStaffRole(user?.role) || Boolean(user?.is_staff_role);
  if (allow === "client" && staff) {
    return <Spinner className="min-h-[50vh]" />;
  }
  if (allow === "staff" && user && !staff) {
    return <Spinner className="min-h-[50vh]" />;
  }
  return children;
}
