import { and, eq } from "drizzle-orm";

import { db } from "~/db/index.server";
import { choreCompletions, chores, type User } from "~/db/schema";
import { getWeekAssignment, type UserAssignment } from "~/lib/rotation";

import { getOrderedUsers } from "./household.server";

export type ChoreView = {
  id: string;
  name: string;
  tag: "Chaque semaine" | "Toutes les 2 semaines";
  done: boolean;
};

export type UserWeekChores = {
  user: User;
  chores: ChoreView[];
};

async function getAssignment(
  isoWeek: string,
): Promise<{ users: [User, User]; assignment: [UserAssignment, UserAssignment] } | null> {
  const orderedUsers = await getOrderedUsers();
  if (orderedUsers.length < 2) return null;
  const [first, second] = orderedUsers as [User, User];
  const assignment = getWeekAssignment(isoWeek, [
    { id: first.id },
    { id: second.id },
  ]);
  return { users: [first, second], assignment };
}

/** Always in stable households.member_order order — see rotation.ts. Reorder for
 * "signed-in user first" display in the caller, not here. */
export async function getWeekChores(
  isoWeek: string,
): Promise<UserWeekChores[]> {
  const resolved = await getAssignment(isoWeek);
  if (!resolved) return [];
  const { users: [first, second], assignment } = resolved;

  const allChores = await db.select().from(chores);
  const completions = await db
    .select()
    .from(choreCompletions)
    .where(eq(choreCompletions.isoWeek, isoWeek));
  const completedChoreIds = new Set(completions.map((c) => c.choreId));

  const byGroup = (group: string) =>
    allChores.filter((chore) => chore.rotationGroup === group);

  const buildForUser = (
    userAssignment: UserAssignment,
    user: User,
  ): UserWeekChores => ({
    user,
    chores: [
      ...byGroup(userAssignment.weeklyGroup).map((chore) => ({
        id: chore.id,
        name: chore.name,
        tag: "Chaque semaine" as const,
        done: completedChoreIds.has(chore.id),
      })),
      ...byGroup(userAssignment.biweeklyGroup).map((chore) => ({
        id: chore.id,
        name: chore.name,
        tag: "Toutes les 2 semaines" as const,
        done: completedChoreIds.has(chore.id),
      })),
    ],
  });

  return [
    buildForUser(assignment[0], first),
    buildForUser(assignment[1], second),
  ];
}

export async function toggleChoreCompletion(
  choreId: string,
  isoWeek: string,
): Promise<void> {
  const [existing] = await db
    .select()
    .from(choreCompletions)
    .where(
      and(
        eq(choreCompletions.choreId, choreId),
        eq(choreCompletions.isoWeek, isoWeek),
      ),
    )
    .limit(1);

  if (existing) {
    await db.delete(choreCompletions).where(eq(choreCompletions.id, existing.id));
    return;
  }

  const [chore] = await db.select().from(chores).where(eq(chores.id, choreId)).limit(1);
  if (!chore) throw new Error("Chore not found");

  const resolved = await getAssignment(isoWeek);
  if (!resolved) throw new Error("Household is missing users");
  const assignee = resolved.assignment.find(
    (a) =>
      a.weeklyGroup === chore.rotationGroup ||
      a.biweeklyGroup === chore.rotationGroup,
  );
  if (!assignee) throw new Error("Could not determine chore assignee");

  await db.insert(choreCompletions).values({
    choreId,
    userId: assignee.userId,
    isoWeek,
  });
}
