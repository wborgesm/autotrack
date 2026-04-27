import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      nome: true, telefone: true, email: true, endereco: true, logo: true,
      latitude: true, longitude: true, raioPermitido: true, tipoOficina: true,
      addonGps: true, addonPontos: true, addonWhatsapp: true, addonPortalCliente: true,
    },
  });

  return NextResponse.json({
    oficina: tenant,
    addons: {
      ponto: true,
      whatsapp: tenant?.addonWhatsapp,
      sms: true,
      gps: tenant?.addonGps,
      pontos: tenant?.addonPontos,
      portal: tenant?.addonPortalCliente,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user.nivel)) {
    return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
  }
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });

  const body = await req.json();
  const { oficina, addons } = body;

  if (oficina) {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        nome: oficina.nome, telefone: oficina.telefone, email: oficina.email,
        endereco: oficina.endereco, logo: oficina.logo,
        latitude: oficina.latitude, longitude: oficina.longitude,
        raioPermitido: oficina.raioPermitido ? Number(oficina.raioPermitido) : undefined,
        tipoOficina: oficina.tipoOficina,
      },
    });
  }

  if (addons && session.user.nivel === "SUPER_ADMIN") {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        addonGps: addons.gps, addonPontos: addons.pontos,
        addonWhatsapp: addons.whatsapp, addonPortalCliente: addons.portal,
      },
    });
  }

  return NextResponse.json({ success: true });
}
