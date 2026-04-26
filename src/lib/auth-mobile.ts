import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-change-me";

export interface MobileUser {
  userId: string;
  tenantId: string;
  nivel: string;
  email: string;
}

export function getMobileUser(req: NextRequest): MobileUser | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as MobileUser;
    return decoded;
  } catch {
    return null;
  }
}
