import {
  Briefcase,
  FileCheck,
  FileText,
  Home,
  Plane,
  Scale,
  Stamp,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  home: Home,
  plane: Plane,
  scale: Scale,
  "file-check": FileCheck,
  "file-text": FileText,
  stamp: Stamp,
  briefcase: Briefcase,
};

export function ServiceIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Briefcase;
  return <Icon className={className} aria-hidden />;
}
