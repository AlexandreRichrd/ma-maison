import { eq } from "drizzle-orm";

import { db } from "~/db/index.server";
import { households, users, type User } from "~/db/schema";

/** Users in `households.member_order` order — stable, so rotation never scrambles. */
export async function getOrderedUsers(): Promise<User[]> {
  const [household] = await db.select().from(households).limit(1);
  if (!household) return [];

  const rows = await db
    .select()
    .from(users)
    .where(eq(users.householdId, household.id));
  const byId = new Map(rows.map((user) => [user.id, user]));

  return household.memberOrder
    .map((id) => byId.get(id))
    .filter((user): user is User => user != null);
}
