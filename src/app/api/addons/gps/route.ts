import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TraccarService } from "@/lib/traccar";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenant = await prisma.tenant.findUnique({ where: { id: session.user.tenantId } });
  if (!tenant || !tenant.addonGps) return NextResponse.json({ error: "Addon GPS não ativo" }, { status: 403 });

  const searchParams = req.nextUrl.searchParams;
  const action = searchParams.get("action") || "devices";
  const serverId = searchParams.get("serverId");

  if (!serverId) return NextResponse.json({ error: "serverId é obrigatório" }, { status: 400 });

  const server = await prisma.traccarServer.findFirst({
    where: {
      id: serverId,
      tenantId: session.user.tenantId,
      OR: [{ usuarioId: session.user.id }, { usuarioId: null }],
    },
  });

  if (!server) return NextResponse.json({ error: "Servidor não encontrado" }, { status: 404 });

  try {
    const service = new TraccarService(server);

    if (action === "test") {
      const ok = await service.testConnection();
      return NextResponse.json({ ok });
    }
    if (action === "devices") {
      const devices = await service.getDevices();
      return NextResponse.json(devices);
    }
    if (action === "positions") {
      const deviceId = searchParams.get("deviceId");
      const positions = await service.getPositions(deviceId ? parseInt(deviceId) : undefined);
      return NextResponse.json(positions);
    }
    if (action === "historico") {
      const deviceId = searchParams.get("deviceId");
      const from = searchParams.get("from");
      const to = searchParams.get("to");
      if (!deviceId || !from || !to) return NextResponse.json({ error: "Parâmetros obrigatórios" }, { status: 400 });
      const route = await service.getRoute(parseInt(deviceId), new Date(from), new Date(to));
      return NextResponse.json(route);
    }
    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

const vincularSchema = z.object({
  action: z.literal("vincular"),
  veiculoId: z.string(),
  imei: z.string(),
  traccarDeviceId: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenant = await prisma.tenant.findUnique({ where: { id: session.user.tenantId } });
  if (!tenant || !tenant.addonGps) return NextResponse.json({ error: "Addon GPS não ativo" }, { status: 403 });

  try {
    const body = await req.json();
    if (body.action === "vincular") {
      const validated = vincularSchema.parse(body);
      await prisma.veiculo.update({
        where: { id: validated.veiculoId, tenantId: tenant.id },
        data: { imeiGps: validated.imei, dispositivoTraccarId: validated.traccarDeviceId },
      });
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
