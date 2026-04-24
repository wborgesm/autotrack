import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Apenas SUPER_ADMIN pode aceder à auditoria
  if (!session || session.user.nivel !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Acesso restrito ao SUPER_ADMIN" }, { status: 403 });
  }
  
  const tenantId = session.user.tenantId;
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
  }

  const { searchParams } = req.nextUrl;
  const entidade = searchParams.get("entidade") || undefined;
  const usuarioId = searchParams.get("usuarioId") || undefined;
  const limit = Number(searchParams.get("limit")) || 50;
  const page = Number(searchParams.get("page")) || 0;

  // SUPER_ADMIN vê logs de todos os tenants
  const where: any = {};
  if (entidade) where.entidade = entidade;
  if (usuarioId) where.usuarioId = usuarioId;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: page * limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({ logs, total, page, totalPages: Math.ceil(total / limit) });
}
