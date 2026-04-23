import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const body = await req.json();
  const updated = await prisma.traccarServer.updateMany({
    where: { id: params.id, tenantId: session.user.tenantId, usuarioId: session.user.id },
    data: body,
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  await prisma.traccarServer.deleteMany({
    where: { id: params.id, tenantId: session.user.tenantId, usuarioId: session.user.id },
  });
  return NextResponse.json({ success: true });
}
