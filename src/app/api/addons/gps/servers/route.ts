import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const usuarioId = session.user.id;
  const tenantId = session.user.tenantId;

  const servidores = await prisma.traccarServer.findMany({
    where: {
      tenantId,
      OR: [{ usuarioId }, { usuarioId: null }],
    },
    orderBy: { ordem: "asc" },
  });
  return NextResponse.json(servidores);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;
  const usuarioId = session.user.id;
  const body = await req.json();
  const server = await prisma.traccarServer.create({
    data: { ...body, tenantId, usuarioId },
  });
  return NextResponse.json(server, { status: 201 });
}
