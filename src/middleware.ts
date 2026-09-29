import { NextResponse } from "next/server";

export function middleware(req: any) {
  const token = req.cookies.get("token")?.value;

  const protectedPaths = ["/admin", "/api/lands"];

  if (protectedPaths.some((p) => req.nextUrl.pathname.startsWith(p))) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Silently prepare a visitor ID for homepage tracking.
  if (req.nextUrl.pathname === "/") {
    let visitorId = req.cookies.get("propvest_visitor_id")?.value;

    if (!visitorId) {
      visitorId = crypto.randomUUID();
    }

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-propvest-visitor-id", visitorId);

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    if (!req.cookies.get("propvest_visitor_id")) {
      response.cookies.set("propvest_visitor_id", visitorId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      });
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/api/lands/:path*"],
};
