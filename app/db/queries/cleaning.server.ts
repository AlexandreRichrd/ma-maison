import { and, eq } from "drizzle-orm";

import { db } from "~/db/index.server";
import { choreCompletions, chores, type Member } from "~/db/schema";
import { getWeekAssignment, type MemberAssignment } from "~/lib/rotation";

import { getOrderedMembers } from "./household.server";

export type ChoreView = {
  id: string;
  name: string;
  tag: "Weekly" | "Every 2 wks";
  done: boolean;
};

export type MemberWeekChores = {
  member: Member;
  chores: ChoreView[];
};

async function getAssignment(
  isoWeek: string,
): Promise<{ members: [Member, Member]; assignment: [MemberAssignment, MemberAssignment] } | null> {
  const orderedMembers = await getOrderedMembers();
  if (orderedMembers.length < 2) return null;
  const [first, second] = orderedMembers as [Member, Member];
  const assignment = getWeekAssignment(isoWeek, [
    { id: first.id },
    { id: second.id },
  ]);
  return { members: [first, second], assignment };
}

export async function getWeekChores(
  isoWeek: string,
): Promise<MemberWeekChores[]> {
  const resolved = await getAssignment(isoWeek);
  if (!resolved) return [];
  const { members: [first, second], assignment } = resolved;

  const allChores = await db.select().from(chores);
  const completions = await db
    .select()
    .from(choreCompletions)
    .where(eq(choreCompletions.isoWeek, isoWeek));
  const completedChoreIds = new Set(completions.map((c) => c.choreId));

  const byGroup = (group: string) =>
    allChores.filter((chore) => chore.rotationGroup === group);

  const buildForMember = (
    memberAssignment: MemberAssignment,
    member: Member,
  ): MemberWeekChores => ({
    member,
    chores: [
      ...byGroup(memberAssignment.weeklyGroup).map((chore) => ({
        id: chore.id,
        name: chore.name,
        tag: "Weekly" as const,
        done: completedChoreIds.has(chore.id),
      })),
      ...byGroup(memberAssignment.biweeklyGroup).map((chore) => ({
        id: chore.id,
        name: chore.name,
        tag: "Every 2 wks" as const,
        done: completedChoreIds.has(chore.id),
      })),
    ],
  });

  return [
    buildForMember(assignment[0], first),
    buildForMember(assignment[1], second),
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
  if (!resolved) throw new Error("Household is missing members");
  const assignee = resolved.assignment.find(
    (a) =>
      a.weeklyGroup === chore.rotationGroup ||
      a.biweeklyGroup === chore.rotationGroup,
  );
  if (!assignee) throw new Error("Could not determine chore assignee");

  await db.insert(choreCompletions).values({
    choreId,
    memberId: assignee.memberId,
    isoWeek,
  });
}
