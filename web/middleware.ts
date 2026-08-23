import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { STAFF_ROLES } from "@/types/api";

export function middleware(request: NextRequest) {
  const role = request.cookies.get("mzansi.role")?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/portal") || pathname.startsWith("/dashboard")) {
    if (!role) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if ((STAFF_ROLES as readonly string[]).includes(role)) {
      return NextResponse.redirect(new URL("/staff", request.url));
    }
  }

  if (pathname.startsWith("/staff")) {
    if (!role) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (role === "CLIENT") {
      return NextResponse.redirect(new URL("/portal", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/:path*", "/dashboard/:path*", "/staff/:path*"],
};
