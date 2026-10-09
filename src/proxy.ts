import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { COOKIE_NAME, getSessionSecretKey } from "@/lib/auth/secret";

type Role = "super_admin" | "school_admin" | "parent";

const HOME_BY_ROLE: Record<Role, string> = {
  super_admin: "/super",
  school_admin: "/school",
  parent: "/parent",
};

// Which roles may open each protected area of the app.
const AREAS: { prefix: string; roles: Role[] }[] = [
  { prefix: "/super", roles: ["super_admin"] },
  { prefix: "/school", roles: ["school_admin", "super_admin"] },
  { prefix: "/parent", roles: ["parent"] },
  { prefix: "/cart", roles: ["parent"] },
  { prefix: "/checkout", roles: ["parent"] },
  { prefix: "/orders", roles: ["parent"] },
  { prefix: "/profile", roles: ["parent"] },
];

async function readRole(req: NextRequest): Promise<Role | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSessionSecretKey());
    return (payload.role as Role) || null;
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const area = AREAS.find((a) => pathname === a.prefix || pathname.startsWith(a.prefix + "/"));
  if (!area) return NextResponse.next();

  const role = await readRole(req);
  if (!role) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  if (!area.roles.includes(role)) {
    return NextResponse.redirect(new URL(HOME_BY_ROLE[role] || "/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/super/:path*", "/school/:path*", "/parent/:path*", "/cart/:path*", "/checkout/:path*", "/orders/:path*", "/profile/:path*"],
};
