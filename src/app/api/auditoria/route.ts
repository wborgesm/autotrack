import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkApiPermissao } from "@/lib/permissoes";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.nivel)) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const entidade = searchParams.get("entidade") || undefined;
  const usuarioId = searchParams.get("usuarioId") || undefined;
  const limit = Number(searchParams.get("limit")) || 50;
  const page = Number(searchParams.get("page")) || 0;

  const where: any = { tenantId };
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
