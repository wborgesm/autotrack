import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });

  const { searchParams } = req.nextUrl;
  const hoje = new Date();
  const inicio = searchParams.get("inicio") || new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString();
  const fim = searchParams.get("fim") || new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59).toISOString();

  const registos = await prisma.registroTempo.findMany({
    where: { tenantId, dataHora: { gte: new Date(inicio), lte: new Date(fim) } },
    include: { tecnico: { select: { nome: true } }, ordem: { select: { numero: true } } },
    orderBy: { dataHora: "asc" },
  });

  const resumo: Record<string, any> = {};
  for (let i = 0; i < registos.length; i++) {
    const reg = registos[i];
    if (!resumo[reg.tecnicoId]) resumo[reg.tecnicoId] = { nome: reg.tecnico.nome, minutos: 0 };
    if (reg.tipo === "ENTRADA") {
      const saida = registos.slice(i + 1).find(r => r.tecnicoId === reg.tecnicoId && r.tipo === "SAIDA");
      if (saida) resumo[reg.tecnicoId].minutos += (new Date(saida.dataHora).getTime() - new Date(reg.dataHora).getTime()) / 60000;
    }
  }

  return NextResponse.json({
    porTecnico: Object.entries(resumo).map(([id, data]: any) => ({
      tecnicoId: id, nome: data.nome, horas: (data.minutos / 60).toFixed(1)
    })),
    totalRegistos: registos.length,
  });
}
