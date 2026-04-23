import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Rotas públicas da API (checkout, ativação)
    if (path === "/api/checkout" || path === "/api/ativar") {
      return NextResponse.next();
    }

    if (path.startsWith("/api/auth") || path === "/login") {
      return NextResponse.next();
    }

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (token.tenantAtivo === false) {
      return NextResponse.redirect(new URL("/login?error=tenant_inativo", req.url));
    }

    const nivel = token.nivel;

    if (path.startsWith("/usuarios") && !["SUPER_ADMIN", "ADMIN", "GERENTE"].includes(nivel)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (path.startsWith("/configuracoes") && !["SUPER_ADMIN", "ADMIN"].includes(nivel)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (nivel === "CLIENTE" && !path.startsWith("/portal")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const path = req.nextUrl.pathname;
        // Permitir acesso público a estas rotas mesmo sem token
        if (path === "/login" || path.startsWith("/api/auth") || path === "/api/checkout" || path === "/api/ativar") {
          return true;
        }
        return !!token;
      },
    },
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads).*)"],
};
