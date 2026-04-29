import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export default async function middleware(request: NextRequest) {
  // Manter compatibilidade com next-auth
  const token = await getToken({ req: request });
  if (token?.id) {
    const tokenJwt = request.cookies.get("__Secure-next-auth.session-token")?.value
      || request.cookies.get("next-auth.session-token")?.value;
    if (tokenJwt) {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.ip || "desconhecido";
      const userAgent = request.headers.get("user-agent") || "";
      // Extrair sistema operacional e navegador do user-agent
      let os = "Desconhecido";
      let browser = "Desconhecido";
      if (userAgent.includes("Windows")) os = "Windows";
      else if (userAgent.includes("Mac")) os = "MacOS";
      else if (userAgent.includes("Linux")) os = "Linux";
      else if (userAgent.includes("Android")) os = "Android";
      else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS";
      if (userAgent.includes("Chrome")) browser = "Chrome";
      else if (userAgent.includes("Firefox")) browser = "Firefox";
      else if (userAgent.includes("Safari")) browser = "Safari";
      else if (userAgent.includes("Edge")) browser = "Edge";
      await prisma.sessao.upsert({
        where: { token: tokenJwt },
        update: { ip, userAgent, os, browser, updatedAt: new Date() },
        create: { token: tokenJwt, userId: token.id as string, ip, userAgent, os, browser },
      }).catch(() => {});
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
};
