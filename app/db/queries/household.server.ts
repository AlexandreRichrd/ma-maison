import { eq } from "drizzle-orm";

import { db } from "~/db/index.server";
import { households, members, type Member } from "~/db/schema";

/** Members in `households.member_order` order — stable, so rotation never scrambles. */
export async function getOrderedMembers(): Promise<Member[]> {
  const [household] = await db.select().from(households).limit(1);
  if (!household) return [];

  const rows = await db
    .select()
    .from(members)
    .where(eq(members.householdId, household.id));
  const byId = new Map(rows.map((member) => [member.id, member]));

  return household.memberOrder
    .map((id) => byId.get(id))
    .filter((member): member is Member => member != null);
}
