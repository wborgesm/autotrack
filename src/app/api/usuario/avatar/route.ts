import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("avatar") as File | null;
    if (!file) return NextResponse.json({ error: "Nenhum arquivo" }, { status: 400 });

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
    if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: "Máximo 2MB" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadDir = path.join(process.cwd(), "public/uploads/avatars");
    await mkdir(uploadDir, { recursive: true });

    const ext = path.extname(file.name);
    const fileName = `${session.user.id}-${Date.now()}${ext}`;
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    const avatarUrl = `/uploads/avatars/${fileName}`;
    await prisma.usuario.update({ where: { id: session.user.id }, data: { avatar: avatarUrl } });

    return NextResponse.json({ avatarUrl });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
