import { describe, expect, it } from "vitest";

import {
  formatIsoWeek,
  getCurrentIsoWeek,
  isValidIsoWeek,
  parseIsoWeek,
  shiftIsoWeek,
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
