import { describe, expect, it } from "vitest";

import { getWeekAssignment, ROTATION_EPOCH } from "./rotation";

const members: [{ id: string }, { id: string }] = [
  { id: "mia" },
  { id: "sam" },
];

describe("getWeekAssignment", () => {
  it("assigns the epoch week deterministically", () => {
    const assignment = getWeekAssignment(ROTATION_EPOCH, members);
    expect(assignment).toEqual([
      { memberId: "mia", weeklyGroup: "A", biweeklyGroup: "C" },
      { memberId: "sam", weeklyGroup: "B", biweeklyGroup: "D" },
    ]);
  });

  it("is pure and deterministic — same input, same output", () => {
    const a = getWeekAssignment("2026-W03", members);
    const b = getWeekAssignment("2026-W03", members);
    expect(a).toEqual(b);
  });

  it("alternates the weekly group every week", () => {
    const week1 = getWeekAssignment("2024-W01", members);
    const week2 = getWeekAssignment("2024-W02", members);
    const week3 = getWeekAssignment("2024-W03", members);
    expect(week1[0].weeklyGroup).toBe("A");
    expect(week2[0].weeklyGroup).toBe("B");
    expect(week3[0].weeklyGroup).toBe("A");
  });

  it("alternates the biweekly group every two weeks", () => {
    const week1 = getWeekAssignment("2024-W01", members);
    const week2 = getWeekAssignment("2024-W02", members);
    const week3 = getWeekAssignment("2024-W03", members);
    const week4 = getWeekAssignment("2024-W04", members);
    const week5 = getWeekAssignment("2024-W05", members);
    expect(week1[0].biweeklyGroup).toBe("C");
    expect(week2[0].biweeklyGroup).toBe("C");
    expect(week3[0].biweeklyGroup).toBe("D");
    expect(week4[0].biweeklyGroup).toBe("D");
    expect(week5[0].biweeklyGroup).toBe("C");
  });

  it("always gives the two members opposite weekly groups", () => {
    for (let i = 0; i < 10; i++) {
      const [a, b] = getWeekAssignment(`2024-W${String(i + 1).padStart(2, "0")}`, members);
      expect(a.weeklyGroup).not.toBe(b.weeklyGroup);
    }
  });

  it("always gives the two members opposite biweekly groups", () => {
    for (let i = 0; i < 10; i++) {
      const [a, b] = getWeekAssignment(`2024-W${String(i + 1).padStart(2, "0")}`, members);
      expect(a.biweeklyGroup).not.toBe(b.biweeklyGroup);
    }
  });

  it("handles a week before the epoch (past)", () => {
    const assignment = getWeekAssignment("2023-W52", members);
    expect(assignment[0].weeklyGroup).toBe("B");
  });

  it("handles a week well into the future", () => {
    const assignment = getWeekAssignment("2030-W20", members);
    expect(assignment[0].weeklyGroup === "A" || assignment[0].weeklyGroup === "B").toBe(true);
    expect(assignment[1].weeklyGroup).not.toBe(assignment[0].weeklyGroup);
  });

  it("is stable across a year boundary (ISO weeks don't align with calendar years)", () => {
    // 2026-W53 is the last ISO week of 2026; 2027-W01 immediately follows it.
    const last = getWeekAssignment("2026-W53", members);
    const first = getWeekAssignment("2027-W01", members);
    expect(last[0].weeklyGroup).not.toBe(first[0].weeklyGroup);
  });

  it("respects member order for stable rotation regardless of id values", () => {
    const reordered: [{ id: string }, { id: string }] = [
      { id: "sam" },
      { id: "mia" },
    ];
    const assignment = getWeekAssignment(ROTATION_EPOCH, reordered);
    expect(assignment[0].memberId).toBe("sam");
    expect(assignment[0].weeklyGroup).toBe("A");
    expect(assignment[1].memberId).toBe("mia");
    expect(assignment[1].weeklyGroup).toBe("B");
  });
});
