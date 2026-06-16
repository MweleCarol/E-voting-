import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROLE_ROUTES: Record<string, string[]> = {
  "/admin": ["ELECTION_OFFICER", "VERIFICATION_OFFICER", "AUDITOR", "SYSTEM_ADMIN", "OBSERVER"],
  "/student": ["STUDENT", "CANDIDATE"],
};

export function middleware(request: NextRequest) {
  // With mock data: read role from a cookie or header you set on mock login
  // With real backend: validate JWT here
  const role = request.cookies.get("sevs_role")?.value;

  for (const [path, allowed] of Object.entries(ROLE_ROUTES)) {
    if (request.nextUrl.pathname.startsWith(path)) {
      if (!role || !allowed.includes(role)) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }
  }
  return NextResponse.next();
}