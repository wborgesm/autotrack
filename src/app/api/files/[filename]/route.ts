import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

const UPLOAD_DIR = "/var/www/html/autotrack/uploads";

export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const filename = params.filename;

  // Proteção contra path traversal
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return NextResponse.json({ error: "Nome de ficheiro inválido" }, { status: 400 });
  }

  const filePath = path.join(UPLOAD_DIR, filename);
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "Ficheiro não encontrado" }, { status: 404 });
  }

  try {
    const buffer = await readFile(filePath);
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".pdf": "application/pdf",
    };
    const contentType = mimeTypes[ext] || "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Erro ao ler ficheiro:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
