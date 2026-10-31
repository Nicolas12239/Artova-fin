import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_SESSION = "artova_session";

function secret(): Uint8Array {
  return new TextEncoder().encode(process.env.AUTH_SECRET ?? "");
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(COOKIE_SESSION)?.value;

  let session: { sub: string; role: string } | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret());
      if (payload.sub) {
        session = { sub: payload.sub, role: String(payload.role ?? "") };
      }
    } catch {
      session = null;
    }
  }

  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.search = "";
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (session.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/artistes/:path*",
    "/oeuvres/:path*",
    "/compte/:path*",
    "/espace-artiste/:path*",
    "/commande/:path*",
    "/admin/:path*",
  ],
};
