import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated, fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@/../convex/_generated/api";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.redirect(new URL("/signin", req.url));
    }

    const user = await fetchAuthQuery(api.credits.getMe);
    if (user?.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
