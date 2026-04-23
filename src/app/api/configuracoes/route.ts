import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
  if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.nivel)) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true, nome: true, cnpj: true, telefone: true, email: true,
      endereco: true, logo: true, plano: true,
      addonGps: true, addonPontos: true, addonWhatsapp: true, addonPortalCliente: true,
      pontosPorReal: true, bonusMoto: true, minimoResgate: true, validadeMeses: true,
    },
  });
  return NextResponse.json(tenant);
}

const schema = z.object({
  nome: z.string().optional(),
  cnpj: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  endereco: z.string().optional(),
  logo: z.string().optional(),
  addonGps: z.boolean().optional(),
  addonPontos: z.boolean().optional(),
  addonWhatsapp: z.boolean().optional(),
  addonPortalCliente: z.boolean().optional(),
  pontosPorReal: z.preprocess((v) => (v === "" || v === null ? undefined : Number(v)), z.number().int().optional()),
  bonusMoto: z.preprocess((v) => (v === "" || v === null ? undefined : Number(v)), z.number().int().optional()),
  minimoResgate: z.preprocess((v) => (v === "" || v === null ? undefined : Number(v)), z.number().int().optional()),
  validadeMeses: z.preprocess((v) => (v === "" || v === null ? undefined : Number(v)), z.number().int().optional()),
});

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });
  if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.nivel)) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }

  try {
    const body = await req.json();
    Object.keys(body).forEach(k => { if (body[k] === "" || body[k] === null) delete body[k]; });
    const validated = schema.parse(body);
    const updated = await prisma.tenant.update({ where: { id: tenantId }, data: validated });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
