"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Calendar,
  FileSearch,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  LogOut,
  Newspaper,
  Users,
} from "lucide-react";

import { BrandMark } from "@/components/brand/BrandMark";
import { cn } from "@/lib/cn";
import { signOut } from "@/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const LINKS = [
  { href: "/staff", label: "Dashboard", icon: LayoutDashboard },
  { href: "/staff/applications", label: "Applications", icon: FolderKanban },
  { href: "/staff/documents", label: "Documents", icon: FileSearch },
  { href: "/staff/clients", label: "Clients", icon: Users },
  { href: "/staff/consultations", label: "Consultations", icon: Calendar },
  { href: "/staff/inquiries", label: "Inquiries", icon: Inbox },
  { href: "/staff/content", label: "Content", icon: Newspaper },
  { href: "/staff/reports", label: "Reports", icon: BarChart3 },
];

export function StaffShell({ children }: { children: React.ReactNode }) {
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
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-[272px] shrink-0 overflow-y-auto bg-navy p-6 text-white lg:block">
          <BrandMark name="Mzansi Visa Solutions" href="/staff" invert />
          <div className="mt-6 rounded-2xl bg-white/8 px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">Staff</p>
            <p className="mt-1 text-sm">{user?.full_name}</p>
            <p className="text-xs text-white/45">{user?.role?.replaceAll("_", " ")}</p>
          </div>
          <nav className="mt-7 space-y-1">
            {LINKS.map((link) => {
              const active = pathname === link.href || (link.href !== "/staff" && pathname.startsWith(link.href));
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    active ? "bg-brand text-white" : "text-white/70 hover:bg-white/8 hover:text-white",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <button type="button" onClick={() => void logout()} className="mt-10 flex items-center gap-2 text-sm text-white/55 hover:text-white">
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </aside>
        <div className="min-w-0 flex-1 px-4 py-8 md:px-10">
          <div className="mb-6 flex gap-2 overflow-x-auto lg:hidden">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs shadow-sm">
                {link.label}
              </Link>
            ))}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
