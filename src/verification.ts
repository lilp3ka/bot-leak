import "dotenv/config";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

export function normalizeEmail(raw: string): string | null {
  const normalized = raw.trim().toLowerCase();

  if (normalized.length === 0 || normalized.length > 254) {
    return null;
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized)) {
    return null;
  }

  return normalized;
}

export function generateCode(): string {
  const code = randomInt(0, 1000000);

  return String(code).padStart(6, "0");
}

export function hashCode(code: string): string {
  const secret = process.env.CODE_SECRET;

  if (!secret) {
    throw new Error("CODE_SECRET is not configured");
  }

  return createHmac("sha256", secret).update(code).digest("hex");
}

export function verifyCode(inputCode: string, storedHash: string): boolean {
  const inputHash = hashCode(inputCode);

  const bufA = Buffer.from(inputHash, "hex");
  const bufB = Buffer.from(storedHash, "hex");

  if (bufA.length !== bufB.length) {
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}
