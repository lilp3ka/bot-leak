import { prisma } from "./db.js";
import { normalizeEmail, generateCode, hashCode, verifyCode } from "./verification.js";

export type StartResult =
  | { ok: true; email: string; code: string }
  | { ok: false; reason: "invalid_email" | "too_soon" | "too_many" };

export async function startVerification(
  telegramId: string,
  rawEmail: string,
): Promise<StartResult> {
  const email = normalizeEmail(rawEmail);

  if (email === null) {
    return {
      ok: false,
      reason: "invalid_email",
    };
  }

  const userRecord = await prisma.user.upsert({
    where: {
      telegramId,
    },
    update: {},
    create: {
      telegramId,
    },
  });

  const emailRecord = await prisma.email.upsert({
    where: {
      userId_address: {
        userId: userRecord.id,
        address: email,
      },
    },
    update: {},
    create: {
      userId: userRecord.id,
      address: email,
    },
  });

  const latestCode = await prisma.verificationCode.findFirst({
    where: {
      emailId: emailRecord.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (latestCode && Date.now() - latestCode.createdAt.getTime() < 60_000) {
    return {
      ok: false,
      reason: "too_soon",
    };
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const timeCode = await prisma.verificationCode.count({
    where: {
      createdAt: {
        gte: oneHourAgo,
      },
      email: {
        userId: userRecord.id,
      },
    },
  });

  if (timeCode >= 5) {
    return {
      ok: false,
      reason: "too_many",
    };
  }

  const perEmail = await prisma.verificationCode.count({
    where: {
      createdAt: { gte: oneHourAgo },
      email: { address: email },
    },
  });
  if (perEmail >= 3) {
    return {
      ok: false,
      reason: "too_many",
    };
  }

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const code = generateCode();
  const codeHash = hashCode(code);

  await prisma.verificationCode.create({
    data: {
      codeHash,
      expiresAt,
      emailId: emailRecord.id,
    },
  });

  export type ConfirmResult =
  | { ok: true }
  | { ok: false; reason: "no_code" | "expired" | "too_many_attempts" | "wrong_code" };

export async function confirmCode(
  telegramId: string,
  rawEmail: string,
  inputCode: string,
): Promise<ConfirmResult> { ... }

  return {
    ok: true,
    email,
    code,
  };
}
