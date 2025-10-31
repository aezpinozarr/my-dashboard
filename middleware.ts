import { NextResponse, NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ 1. Rutas públicas (NO se bloquean)
  if (
    pathname === "/" || // página de login
    pathname.startsWith("/api") ||
    pathname.startsWith("/seguridad") || // <-- necesario para tu backend
    pathname.startsWith("/public") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/_next")
  ) {
    return NextResponse.next();
  }

  // ✅ 2. Verificar token de sesión
  const token = req.cookies.get("session_token")?.value;

  // Si no hay sesión, redirige al login
  if (!token || token === "undefined" || token === "null" || token.trim() === "") {
    const loginUrl = new URL("/", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // ✅ 3. Deja pasar si hay sesión
  return NextResponse.next();
}

// ✅ 4. Configuración: protege TODO menos archivos estáticos
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images|public|seguridad|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt)).*)',
  ],
};