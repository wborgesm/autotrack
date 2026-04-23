import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const filePath = path.join(process.cwd(), "public", "uploads", ...params.path);
  
  if (!existsSync(filePath)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  try {
    const data = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    return new NextResponse(data, {
      headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=31536000' },
    });
  } catch {
    return new NextResponse("Error", { status: 500 });
  }
}
