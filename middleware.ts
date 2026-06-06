import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TEMP_ACCESS_COOKIE = "kishib_temp_access";
const TEMP_ACCESS_VALUE = "preview_v2";
const PASSWORD_GATE_PATH = "/private-preview";

const PUBLIC_PREFIXES = [
  "/_next",
  "/api",
  "/images",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  PASSWORD_GATE_PATH,
];

function isPublicAsset(pathname: string) {
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  return /\.[a-zA-Z0-9]+$/.test(pathname);
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isPublicAsset(pathname)) {
    return NextResponse.next();
  }

  const hasTemporaryAccess =
    request.cookies.get(TEMP_ACCESS_COOKIE)?.value === TEMP_ACCESS_VALUE;

  if (hasTemporaryAccess) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = PASSWORD_GATE_PATH;
  url.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
