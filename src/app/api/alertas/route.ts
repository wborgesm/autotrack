import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.nivel !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Acesso restrito ao SUPER_ADMIN" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const resolvido = searchParams.get("resolvido") === "true" ? true : undefined;
  const gravidade = searchParams.get("gravidade") || undefined;

  const where: any = {};
  if (resolvido !== undefined) where.resolvido = resolvido;
  if (gravidade && gravidade !== "TODAS") where.gravidade = gravidade;

  const alertas = await prisma.alertaFraude.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(alertas);
}
