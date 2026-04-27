import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const versionPath = path.join(process.cwd(), "public", "version.json");
    const data = JSON.parse(fs.readFileSync(versionPath, "utf-8"));
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ version: "1.0.0", nome: "Lançamento Inicial", data: "2026-04-27" });
  }
}
