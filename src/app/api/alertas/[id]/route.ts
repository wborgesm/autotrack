import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.nivel !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Acesso restrito ao SUPER_ADMIN" }, { status: 403 });
  }

  await prisma.alertaFraude.update({
    where: { id: params.id },
    data: { resolvido: true },
  });

  return NextResponse.json({ success: true });
}
