import { describe, expect, it } from "vitest";

import {
  formatIsoDate,
  getCurrentIsoDate,
  isoWeekOfDate,
  isValidIsoDate,
  parseIsoDate,
  shiftIsoDate,
} from "./day";

describe("isValidIsoDate", () => {
  it("accepts well-formed ISO date strings", () => {
    expect(isValidIsoDate("2026-08-20")).toBe(true);
    expect(isValidIsoDate("2026-01-01")).toBe(true);
  });

  it("rejects malformed strings", () => {
    expect(isValidIsoDate("2026-8-20")).toBe(false);
    expect(isValidIsoDate("08-20-2026")).toBe(false);
    expect(isValidIsoDate("not-a-date")).toBe(false);
    expect(isValidIsoDate("")).toBe(false);
  });
});

describe("parseIsoDate / formatIsoDate", () => {
  it("round-trips a date string through a Date", () => {
    expect(formatIsoDate(parseIsoDate("2026-08-20"))).toBe("2026-08-20");
  });

  it("round-trips across a year boundary", () => {
    expect(formatIsoDate(parseIsoDate("2026-12-31"))).toBe("2026-12-31");
    expect(formatIsoDate(parseIsoDate("2027-01-01"))).toBe("2027-01-01");
  });

  it("throws on an invalid string", () => {
    expect(() => parseIsoDate("garbage")).toThrow();
  });
});

describe("shiftIsoDate", () => {
  it("moves forward and backward within a month", () => {
    expect(shiftIsoDate("2026-08-20", 1)).toBe("2026-08-21");
    expect(shiftIsoDate("2026-08-20", -1)).toBe("2026-08-19");
  });

  it("carries over a month boundary going forward", () => {
    expect(shiftIsoDate("2026-08-31", 1)).toBe("2026-09-01");
  });

  it("carries over a year boundary going forward", () => {
    expect(shiftIsoDate("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("is reversible", () => {
    expect(shiftIsoDate(shiftIsoDate("2026-08-20", 5), -5)).toBe(
      "2026-08-20",
    );
  });
});

describe("getCurrentIsoDate", () => {
  it("returns a valid ISO date string", () => {
    expect(isValidIsoDate(getCurrentIsoDate())).toBe(true);
  });
});

describe("isoWeekOfDate", () => {
  it("returns the ISO week containing the given day", () => {
    // 2026-08-20 is a Thursday in ISO week 2026-W34.
    expect(isoWeekOfDate("2026-08-20")).toBe("2026-W34");
  });

  it("a Monday and the preceding Sunday fall in different ISO weeks", () => {
    expect(isoWeekOfDate("2026-08-17")).toBe("2026-W34"); // Monday
    expect(isoWeekOfDate("2026-08-16")).toBe("2026-W33"); // Sunday
  });
});
