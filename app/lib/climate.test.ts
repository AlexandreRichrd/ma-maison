import { describe, expect, it } from "vitest";

import { isStale } from "./climate";

describe("isStale", () => {
  it("is not stale exactly at the threshold", () => {
    const now = new Date("2026-08-15T10:05:00.000Z");
    const recordedAt = new Date("2026-08-15T10:00:00.000Z");
    expect(isStale(recordedAt, now)).toBe(false);
  });

  it("is stale just past the threshold", () => {
    const now = new Date("2026-08-15T10:05:00.001Z");
    const recordedAt = new Date("2026-08-15T10:00:00.000Z");
    expect(isStale(recordedAt, now)).toBe(true);
  });

  it("is not stale for a reading from moments ago", () => {
    const now = new Date("2026-08-15T10:00:30.000Z");
    const recordedAt = new Date("2026-08-15T10:00:00.000Z");
    expect(isStale(recordedAt, now)).toBe(false);
  });
});
