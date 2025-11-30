import { NextResponse, NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  // 1. Permitir login
  if (pathname === "/") {
    return NextResponse.next();
  }

  // 2. Rutas públicas
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/seguridad") ||
    pathname.startsWith("/public") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/_next")
  ) {
    return NextResponse.next();
  }

  // 3. Verificar token
  const token = req.cookies.get("session_token")?.value;

  if (!token || token === "undefined" || token === "null" || token.trim() === "") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 4. Hay sesión → permitir
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images|public|seguridad|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt)).*)',
  ],
};