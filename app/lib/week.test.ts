import { describe, expect, it } from "vitest";

import {
  formatIsoWeek,
  getCurrentIsoWeek,
  isInMonthOf,
  isoWeekDays,
  isValidIsoWeek,
  monthGridWeeks,
  parseIsoWeek,
  shiftIsoWeek,
  shiftIsoWeekByMonths,
} from "./week";

describe("isValidIsoWeek", () => {
  it("accepts well-formed ISO week strings", () => {
    expect(isValidIsoWeek("2026-W32")).toBe(true);
    expect(isValidIsoWeek("2026-W01")).toBe(true);
  });

  it("rejects malformed strings", () => {
    expect(isValidIsoWeek("2026-32")).toBe(false);
    expect(isValidIsoWeek("2026-W54")).toBe(false);
    expect(isValidIsoWeek("2026-W00")).toBe(false);
    expect(isValidIsoWeek("not-a-week")).toBe(false);
    expect(isValidIsoWeek("")).toBe(false);
  });
});

describe("parseIsoWeek / formatIsoWeek", () => {
  it("round-trips a week string through a Date", () => {
    expect(formatIsoWeek(parseIsoWeek("2026-W32"))).toBe("2026-W32");
  });

  it("round-trips the first week of a year", () => {
    expect(formatIsoWeek(parseIsoWeek("2026-W01"))).toBe("2026-W01");
  });

  it("round-trips across a year boundary", () => {
    expect(formatIsoWeek(parseIsoWeek("2026-W53"))).toBe("2026-W53");
    expect(formatIsoWeek(parseIsoWeek("2027-W01"))).toBe("2027-W01");
  });

  it("throws on an invalid string", () => {
    expect(() => parseIsoWeek("garbage")).toThrow();
  });
});

describe("shiftIsoWeek", () => {
  it("moves forward and backward within a year", () => {
    expect(shiftIsoWeek("2026-W32", 1)).toBe("2026-W33");
    expect(shiftIsoWeek("2026-W32", -1)).toBe("2026-W31");
  });

  it("carries over a year boundary going forward", () => {
    expect(shiftIsoWeek("2026-W53", 1)).toBe("2027-W01");
  });

  it("carries over a year boundary going backward", () => {
    expect(shiftIsoWeek("2027-W01", -1)).toBe("2026-W53");
  });

  it("is reversible", () => {
    expect(shiftIsoWeek(shiftIsoWeek("2026-W32", 5), -5)).toBe("2026-W32");
  });
});

describe("getCurrentIsoWeek", () => {
  it("returns a valid ISO week string", () => {
    expect(isValidIsoWeek(getCurrentIsoWeek())).toBe(true);
  });
});

describe("isoWeekDays", () => {
  it("returns the 7 days of the week, Monday first", () => {
    const days = isoWeekDays("2026-W34");
    expect(days).toHaveLength(7);
    expect(formatIsoWeek(days[0])).toBe("2026-W34");
    expect(days.map((d) => d.getDay())).toEqual([1, 2, 3, 4, 5, 6, 0]);
  });
});

describe("shiftIsoWeekByMonths", () => {
  it("moves forward and backward by a calendar month", () => {
    // Not necessarily an exact 4-week jump, or reversible to the exact same
    // week — same non-reversibility calendar months always have (compare
    // date-fns's addMonths(Jan 31, 1) -> Feb 28, back -1 -> Jan 28). Good
    // enough for "roughly a month" navigation, which is all month view needs.
    expect(shiftIsoWeekByMonths("2026-W32", 1)).toBe("2026-W36");
    expect(shiftIsoWeekByMonths("2026-W32", -1)).toBe("2026-W27");
  });

  it("carries over a year boundary", () => {
    expect(shiftIsoWeekByMonths("2026-W49", 2)).toBe("2027-W04");
  });
});

describe("monthGridWeeks", () => {
  it("tiles full weeks covering the whole month", () => {
    // August 2026: Aug 1 is a Saturday, Aug 31 is a Monday — the grid must
    // pad back to the Monday before Aug 1 and forward through Aug 31's week.
    const weeks = monthGridWeeks("2026-W32");
    const firstDay = parseIsoWeek(weeks[0]);
    const lastWeekDays = isoWeekDays(weeks[weeks.length - 1]);

    expect(firstDay.getDay()).toBe(1);
    expect(firstDay.getTime()).toBeLessThanOrEqual(new Date(2026, 7, 1).getTime());
    expect(lastWeekDays[6].getTime()).toBeGreaterThanOrEqual(new Date(2026, 7, 31).getTime());
  });

  it("returns consecutive weeks with no gaps", () => {
    const weeks = monthGridWeeks("2026-W07");
    for (let i = 1; i < weeks.length; i++) {
      expect(shiftIsoWeek(weeks[i - 1], 1)).toBe(weeks[i]);
    }
  });
});

describe("isInMonthOf", () => {
  it("distinguishes in-month days from the grid's padding days", () => {
    expect(isInMonthOf(new Date(2026, 7, 15), "2026-W32")).toBe(true);
    expect(isInMonthOf(new Date(2026, 6, 31), "2026-W32")).toBe(false);
    expect(isInMonthOf(new Date(2026, 8, 1), "2026-W32")).toBe(false);
  });
});
