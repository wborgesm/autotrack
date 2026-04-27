import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Tenant não encontrado" }, { status: 400 });

  const { latitude, longitude } = await req.json();
  if (!latitude || !longitude) return NextResponse.json({ error: "Latitude e longitude obrigatórias" }, { status: 400 });

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant || !tenant.latitude || !tenant.longitude) return NextResponse.json({ autorizado: false, erro: "Localização da oficina não configurada" });

  const R = 6371000;
  const dLat = (parseFloat(tenant.latitude) - parseFloat(latitude)) * Math.PI / 180;
  const dLon = (parseFloat(tenant.longitude) - parseFloat(longitude)) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(parseFloat(latitude) * Math.PI / 180) * Math.cos(parseFloat(tenant.latitude) * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const distancia = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const autorizado = distancia <= (tenant.raioPermitido || 100);

  return NextResponse.json({ autorizado, distancia: Math.round(distancia), raioMetros: tenant.raioPermitido || 100, mensagem: autorizado ? "✅ Dentro do raio" : `❌ Fora do raio (${Math.round(distancia)}m > ${tenant.raioPermitido || 100}m)` });
}
