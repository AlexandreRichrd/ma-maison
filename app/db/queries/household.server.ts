import { eq } from "drizzle-orm";

import { db } from "~/db/index.server";
import { households, users, type User } from "~/db/schema";

/**
 * The only shape household-roster data is ever exposed as outside the auth
 * layer — no passwordHash, no email. Every loader-facing query in this
 * file (and its downstream consumers, e.g. cleaning.server.ts) returns
 * this, never the full `User` row.
 */
export type HouseholdMember = Pick<User, "id" | "name" | "avatarKey" | "role">;

/** Users in `households.member_order` order — stable, so rotation never scrambles. */
export async function getOrderedUsers(): Promise<HouseholdMember[]> {
  const [household] = await db.select().from(households).limit(1);
  if (!household) return [];

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      avatarKey: users.avatarKey,
      role: users.role,
    })
    .from(users)
    .where(eq(users.householdId, household.id));
  const byId = new Map(rows.map((user) => [user.id, user]));

  return household.memberOrder
    .map((id) => byId.get(id))
    .filter((user): user is HouseholdMember => user != null);
}
