import { differenceInCalendarISOWeeks } from "date-fns";

import { parseIsoWeek } from "./week";

/** Reference week zero for the rotation. Arbitrary but fixed — never change. */
export const ROTATION_EPOCH = "2024-W01";

export type RotationMember = { id: string };

export type WeeklyGroup = "A" | "B";
export type BiweeklyGroup = "C" | "D";

export type MemberAssignment = {
  memberId: string;
  weeklyGroup: WeeklyGroup;
  biweeklyGroup: BiweeklyGroup;
};

export type Assignment = [MemberAssignment, MemberAssignment];

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/**
 * Pure, deterministic chore-group rotation. Same isoWeek + members in,
 * same result out — no database access. Only decides which member gets
 * which rotation group this week; joining that against real chore rows
 * is the caller's job (see db/queries/cleaning.server.ts).
 */
export function getWeekAssignment(
  isoWeek: string,
  members: [RotationMember, RotationMember],
): Assignment {
  const weeksSinceEpoch = differenceInCalendarISOWeeks(
    parseIsoWeek(isoWeek),
    parseIsoWeek(ROTATION_EPOCH),
  );

  const weeklyParity = mod(weeksSinceEpoch, 2);
  const biweeklyParity = mod(Math.floor(weeksSinceEpoch / 2), 2);

  const [first, second] = members;
  const firstWeekly: WeeklyGroup = weeklyParity === 0 ? "A" : "B";
  const firstBiweekly: BiweeklyGroup = biweeklyParity === 0 ? "C" : "D";

  return [
    {
      memberId: first.id,
      weeklyGroup: firstWeekly,
      biweeklyGroup: firstBiweekly,
    },
    {
      memberId: second.id,
      weeklyGroup: firstWeekly === "A" ? "B" : "A",
      biweeklyGroup: firstBiweekly === "C" ? "D" : "C",
    },
  ];
}
