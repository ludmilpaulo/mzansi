import { FINANCE_ROLES, STAFF_ROLES, type Role, type User } from "@/types/api";

export function isStaffRole(role: Role | null | undefined): boolean {
  return role !== undefined && role !== null && STAFF_ROLES.includes(role);
}

export function isFinanceRole(role: Role | null | undefined): boolean {
  return role !== undefined && role !== null && FINANCE_ROLES.includes(role);
}

export function isClientUser(user: User | null | undefined): boolean {
  return user?.role === "CLIENT";
}

export function homePathForRole(role: Role | null | undefined): string {
  if (role === "CLIENT") {
    return "/portal";
  }
  if (isStaffRole(role)) {
    return "/staff";
  }
  return "/";
}
