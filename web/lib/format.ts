import type { DocumentStatus, InvoiceStatus, Role } from "@/types/api";

export function formatCents(amountCents: number, currency = "ZAR"): string {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency }).format(amountCents / 100);
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function roleLabel(role: Role): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super admin";
    case "ADMIN":
      return "Admin";
    case "CONSULTANT":
      return "Consultant";
    case "DOCUMENT_REVIEWER":
      return "Document reviewer";
    case "FINANCE":
      return "Finance";
    case "SUPPORT":
      return "Support";
    case "CLIENT":
      return "Client";
  }
}

export function documentStatusLabel(status: DocumentStatus): string {
  switch (status) {
    case "REQUESTED":
      return "Requested";
    case "UPLOADED":
      return "Uploaded";
    case "UNDER_REVIEW":
      return "Under review";
    case "VERIFIED":
      return "Verified";
    case "REJECTED":
      return "Needs attention";
    case "EXPIRED":
      return "Expired";
    case "REPLACEMENT_REQUIRED":
      return "Replacement required";
  }
}

export function invoiceStatusLabel(status: InvoiceStatus): string {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "ISSUED":
      return "Issued";
    case "PAID":
      return "Paid";
    case "VOID":
      return "Void";
    case "OVERDUE":
      return "Overdue";
  }
}
