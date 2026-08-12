import { hash } from "@node-rs/argon2";
import { eq, sql } from "drizzle-orm";

import { db } from "~/db/index.server";
import { emailVerifications, households, invites, users, type User } from "~/db/schema";

import { generateToken } from "./tokens.server";

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

export type RegisterFromInviteInput = {
  inviteId: string;
  householdId: string;
  email: string;
  name: string;
  role: string;
  password: string;
};

export type RegisterFromInviteResult = {
  user: User;
  verificationToken: string;
};

function slugifyAvatarKey(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || "user";
}

/**
 * Creates the invited user, appends them to household.member_order (the
 * stable anchor rotation/ordering read from), marks the invite accepted,
 * and issues an email-verification token — one transaction, so a failure
 * partway through never leaves a half-created account. The activation
 * email is sent by the caller, after commit.
 */
export async function registerFromInvite(
  input: RegisterFromInviteInput,
): Promise<RegisterFromInviteResult> {
  const passwordHash = await hash(input.password);
  const avatarKey = slugifyAvatarKey(input.name);

  return db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({
        householdId: input.householdId,
        email: input.email,
        passwordHash,
        name: input.name,
        role: input.role,
        avatarKey,
      })
      .returning();

    await tx
      .update(households)
      .set({ memberOrder: sql`array_append(${households.memberOrder}, ${user.id})` })
      .where(eq(households.id, input.householdId));

    await tx
      .update(invites)
      .set({ acceptedAt: new Date() })
      .where(eq(invites.id, input.inviteId));

    const verificationToken = generateToken();
    await tx.insert(emailVerifications).values({
      userId: user.id,
      token: verificationToken,
      expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
    });

    return { user, verificationToken };
  });
}
