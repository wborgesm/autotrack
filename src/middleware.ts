import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const path = request.nextUrl.pathname;

  // Rotas públicas (não precisam de autenticação)
  if (
    path.startsWith("/api/auth") ||
    path.startsWith("/api/health") ||  // ← adicionado
    path.startsWith("/login") ||
    path === "/" ||
    path.startsWith("/_next") ||
    path.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // Se não estiver autenticado, redirecionar para login
  if (!token) {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // SUPER_ADMIN pode aceder a tudo
  if (token.nivel === "SUPER_ADMIN") {
    return NextResponse.next();
  }

  // ADMIN não pode aceder à auditoria
  if (path.startsWith("/auditoria") || path.startsWith("/api/auditoria")) {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Acesso restrito ao SUPER_ADMIN" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // ADMIN não pode gerir tenants (se esta rota existir)
  if (path.startsWith("/api/tenants") && token.nivel as string !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Acesso restrito ao SUPER_ADMIN" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
