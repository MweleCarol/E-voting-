import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { UserRole } from "@/lib/types";

// IMPORTANT: route group folders like (student) and (admin) do NOT appear
// in the actual URL — they're organizational only. Match against the real
// paths your pages render at (e.g. /dashboard, /elections, /approvals),
// not against the folder names.

const PUBLIC_PATHS = ["/login", "/verify-otp", "/results", "/verify-receipt"];

const ADMIN_ROLES: UserRole[] = [
  "ELECTION_OFFICER",
  "VERIFICATION_OFFICER",
  "AUDITOR",
  "OBSERVER",
  "SYSTEM_ADMIN",
];

const ROUTE_ROLE_MAP: Array<{ prefix: string; allowed: UserRole[] }> = [
  { prefix: "/admin", allowed: ADMIN_ROLES },
  { prefix: "/approvals", allowed: ["ELECTION_OFFICER", "VERIFICATION_OFFICER", "SYSTEM_ADMIN"] },
  { prefix: "/audit", allowed: ["AUDITOR", "SYSTEM_ADMIN"] },
  { prefix: "/verification", allowed: ["VERIFICATION_OFFICER", "SYSTEM_ADMIN"] },
  { prefix: "/dashboard", allowed: ["STUDENT", "CANDIDATE"] },
  { prefix: "/ballot", allowed: ["STUDENT"] },
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // MOCK: role is read from a plain cookie set by AuthContext.
  // REAL: verify a JWT here (e.g. with jose) and extract the role claim
  // instead of trusting a client-writable cookie.
  const role = request.cookies.get("sevs_role")?.value as UserRole | undefined;

  const matchedRoute = ROUTE_ROLE_MAP.find((r) => pathname.startsWith(r.prefix));

  if (matchedRoute) {
    if (!role || !matchedRoute.allowed.includes(role)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};