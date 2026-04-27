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

  const { nome, plano, ativo, addonGps, addonPontos, addonWhatsapp, addonPortalCliente } = await req.json();
  
  const data: any = {};
  if (nome !== undefined) data.nome = nome;
  if (plano !== undefined) data.plano = plano;
  if (ativo !== undefined) data.ativo = ativo;
  if (addonGps !== undefined) data.addonGps = addonGps;
  if (addonPontos !== undefined) data.addonPontos = addonPontos;
  if (addonWhatsapp !== undefined) data.addonWhatsapp = addonWhatsapp;
  if (addonPortalCliente !== undefined) data.addonPortalCliente = addonPortalCliente;

  const updated = await prisma.tenant.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json(updated);
}
