import { writeFile, mkdir } from "fs/promises";
import path from "path";

export interface UploadResult {
  url: string;
  filename: string;
}

export interface UploadError {
  error: string;
  status: number;
}

const UPLOAD_DIR = "/var/www/html/autotrack/uploads";
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "pdf"];
const ALLOWED_MIMES: Record<string, string[]> = {
  "jpg": ["image/jpeg"],
  "jpeg": ["image/jpeg"],
  "png": ["image/png"],
  "webp": ["image/webp"],
  "pdf": ["application/pdf"],
};
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function saveUploadedFile(file: File): Promise<UploadResult | UploadError> {
  const ext = path.extname(file.name).toLowerCase().slice(1);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { error: `Extensão "${ext}" não permitida. Use: ${ALLOWED_EXTENSIONS.join(", ")}`, status: 400 };
  }

  const allowedMimes = ALLOWED_MIMES[ext] || [];
  if (!allowedMimes.includes(file.type)) {
    return { error: `Tipo de ficheiro "${file.type}" não permitido.`, status: 400 };
  }

  if (file.size > MAX_SIZE) {
    return { error: "Ficheiro excede o tamanho máximo de 10 MB.", status: 400 };
  }

  try {
    const filename = `${crypto.randomUUID()}.${ext}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, filename), buffer);

    return { url: `/api/files/${filename}`, filename };
  } catch (err) {
    console.error("Erro ao gravar ficheiro:", err);
    return { error: "Erro interno ao guardar ficheiro.", status: 500 };
  }
}
