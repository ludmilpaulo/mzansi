"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Calendar,
  FileText,
  Folder,
  Home,
  LogOut,
  MessageSquare,
  Receipt,
  UserRound,
} from "lucide-react";

import { BrandMark } from "@/components/brand/BrandMark";
import { cn } from "@/lib/cn";
import { signOut } from "@/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const LINKS = [
  { href: "/portal", label: "Home", icon: Home },
  { href: "/portal/applications", label: "Applications", icon: Folder },
  { href: "/portal/documents", label: "Documents", icon: FileText },
  { href: "/portal/consultations", label: "Consultations", icon: Calendar },
  { href: "/portal/messages", label: "Messages", icon: MessageSquare },
  { href: "/portal/invoices", label: "Invoices", icon: Receipt },
  { href: "/portal/notifications", label: "Notifications", icon: Bell },
  { href: "/portal/profile", label: "Profile", icon: UserRound },
];

export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  async function logout() {
    await dispatch(signOut());
    router.replace("/");
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="page-shell flex gap-8 py-8">
        <aside className="sticky top-24 hidden h-fit w-64 shrink-0 rounded-[1.5rem] border border-border bg-white p-5 shadow-[var(--shadow-card)] md:block">
          <BrandMark name="Mzansi Visa Solutions" href="/portal" />
          <div className="mt-5 rounded-2xl bg-soft px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">Signed in</p>
            <p className="mt-1 text-sm font-medium text-navy">{user?.full_name}</p>
          </div>
          <nav className="mt-6 space-y-1">
            {LINKS.map((link) => {
              const active = pathname === link.href || (link.href !== "/portal" && pathname.startsWith(link.href));
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    active ? "bg-navy text-white shadow-sm" : "text-charcoal hover:bg-surface",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <button type="button" onClick={() => void logout()} className="mt-6 flex items-center gap-2 px-3 text-sm text-muted hover:text-charcoal">
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </aside>
        <div className="min-w-0 flex-1">
          <div className="mb-6 flex gap-2 overflow-x-auto md:hidden">
            {LINKS.map((link) => {
              const active = pathname === link.href || (link.href !== "/portal" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium",
                    active ? "bg-navy text-white" : "bg-white text-charcoal shadow-sm",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
