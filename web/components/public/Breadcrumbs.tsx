import Link from "next/link";

import { BreadcrumbJsonLd } from "@/components/public/JsonLd";

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) {
    return null;
  }
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Home", path: "/" }, ...items]} />
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:text-navy">
              Home
            </Link>
          </li>
          {items.map((item, index) => {
            const last = index === items.length - 1;
            return (
              <li key={item.path} className="flex items-center gap-2">
                <span aria-hidden="true">/</span>
                {last ? (
                  <span className="text-navy">{item.name}</span>
                ) : (
                  <Link href={item.path} className="hover:text-navy">
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
