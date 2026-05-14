import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth-server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.redirect(new URL("/signin", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
