import { eq } from "drizzle-orm";

import { db } from "~/db/index.server";
import { invites, type Invite } from "~/db/schema";
import { generateToken } from "~/lib/tokens.server";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function createInvite(params: {
  householdId: string;
  invitedByUserId: string;
  email: string;
}): Promise<Invite> {
  const [invite] = await db
    .insert(invites)
    .values({
      householdId: params.householdId,
      invitedByUserId: params.invitedByUserId,
      email: params.email,
      token: generateToken(),
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    })
    .returning();
  return invite;
}

export async function getInviteByToken(token: string): Promise<Invite | null> {
  const [invite] = await db
    .select()
    .from(invites)
    .where(eq(invites.token, token))
    .limit(1);
  return invite ?? null;
}

/** An invite is usable once: not yet accepted, and not expired. */
export function isInviteUsable(invite: Invite): boolean {
  return invite.acceptedAt === null && invite.expiresAt.getTime() > Date.now();
}
