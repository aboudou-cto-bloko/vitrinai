import { NextResponse } from "next/server";
import { api } from "@/../convex/_generated/api";
import { isAuthenticated, fetchAuthQuery } from "@/lib/auth-server";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ role: null }, { status: 401 });
  }

  const user = await fetchAuthQuery(api.credits.getMe);
  return NextResponse.json({ role: user?.role ?? null });
}
