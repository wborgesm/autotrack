import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { userId, ip, userAgent } = await request.json();
  if (!userId) return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });

  await prisma.sessao.upsert({
    where: { token: userId },
    update: { ip, userAgent, updatedAt: new Date() },
    create: { token: userId, userId, ip, userAgent },
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
