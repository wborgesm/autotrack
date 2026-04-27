import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const nivel = session.user.nivel;
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });

  const { searchParams } = req.nextUrl;
  const entidade = searchParams.get("entidade") || undefined;
  const usuarioId = searchParams.get("usuarioId") || undefined;
  const limit = Number(searchParams.get("limit")) || 50;
  const page = Number(searchParams.get("page")) || 0;

  // SUPER_ADMIN vê tudo (todos os tenants)
  if (nivel === "SUPER_ADMIN") {
    const where: any = {};
    if (entidade) where.entidade = entidade;
    if (usuarioId) where.usuarioId = usuarioId;
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: limit, skip: page * limit }),
      prisma.auditLog.count({ where }),
    ]);
    return NextResponse.json({ logs, total, page, totalPages: Math.ceil(total / limit) });
  }

  // ADMIN vê apenas logs do seu tenant, exceto SUPER_ADMIN
  const where: any = { tenantId };
  if (entidade) where.entidade = entidade;
  if (usuarioId) where.usuarioId = usuarioId;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: limit, skip: page * limit }),
    prisma.auditLog.count({ where }),
  ]);
  return NextResponse.json({ logs, total, page, totalPages: Math.ceil(total / limit) });
}
