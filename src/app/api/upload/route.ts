import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Nenhum ficheiro" }, { status: 400 });

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
    }
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Máximo 2MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Guardar na pasta temporária
    const tmpDir = path.join(process.cwd(), "public/uploads/produtos/tmp");
    await mkdir(tmpDir, { recursive: true });

    const ext = path.extname(file.name).toLowerCase(); // extensão sempre minúscula
    const tempName = `tmp-${Date.now()}${ext}`;
    const filePath = path.join(tmpDir, tempName);
    await writeFile(filePath, buffer);

    const tmpUrl = `/uploads/produtos/tmp/${tempName}`;
    return NextResponse.json({ url: tmpUrl });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
