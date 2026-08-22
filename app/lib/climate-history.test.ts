import { describe, expect, it } from "vitest";

import type { ClimateSummaryReading } from "./climate-summary-api.server";
import { groupByType } from "./climate-history";

function reading(overrides: Partial<ClimateSummaryReading> = {}): ClimateSummaryReading {
  return {
    type: "temperature",
    date: "2026-08-15",
    min: 18,
    max: 22,
    avg: 20,
    sampleCount: 1440,
    ...overrides,
  };
}

describe("groupByType", () => {
  it("splits readings into one series per type", () => {
    const readings = [
      reading({ type: "temperature", date: "2026-08-14" }),
      reading({ type: "humidite", date: "2026-08-14" }),
      reading({ type: "temperature", date: "2026-08-15" }),
    ];

    const series = groupByType(readings);

    expect(series.map((s) => s.type)).toEqual(["humidite", "temperature"]);
    expect(series.find((s) => s.type === "temperature")?.readings).toHaveLength(2);
    expect(series.find((s) => s.type === "humidite")?.readings).toHaveLength(1);
  });

  it("orders series alphabetically by type, regardless of input order", () => {
    const readings = [reading({ type: "batterie" }), reading({ type: "temperature" })];
    expect(groupByType(readings).map((s) => s.type)).toEqual(["batterie", "temperature"]);
  });

  it("returns an empty array for no readings", () => {
    expect(groupByType([])).toEqual([]);
  });
});
