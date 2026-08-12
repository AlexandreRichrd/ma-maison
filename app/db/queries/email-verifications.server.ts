import { eq } from "drizzle-orm";

import { db } from "~/db/index.server";
import { emailVerifications, users, type EmailVerification } from "~/db/schema";

export async function getEmailVerificationByToken(
  token: string,
): Promise<EmailVerification | null> {
  const [row] = await db
    .select()
    .from(emailVerifications)
    .where(eq(emailVerifications.token, token))
    .limit(1);
  return row ?? null;
}

/** A verification link is usable once: not yet consumed, and not expired. */
export function isVerificationUsable(verification: EmailVerification): boolean {
  return verification.consumedAt === null && verification.expiresAt.getTime() > Date.now();
}

export async function consumeEmailVerification(
  verification: EmailVerification,
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(emailVerifications)
      .set({ consumedAt: new Date() })
      .where(eq(emailVerifications.id, verification.id));
    await tx
      .update(users)
      .set({ emailVerifiedAt: new Date() })
      .where(eq(users.id, verification.userId));
  });
}
