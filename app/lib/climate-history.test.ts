import { describe, expect, it } from "vitest";

import type { ClimateSummaryReading } from "./climate-summary-api.server";
import { buildChartGeometry, groupByType } from "./climate-history";

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

describe("buildChartGeometry", () => {
  it("returns no points for an empty series", () => {
    const geometry = buildChartGeometry([], { width: 300, height: 120 });
    expect(geometry.points).toEqual([]);
  });

  it("places one point per day, evenly spaced along x", () => {
    const readings = [
      reading({ date: "2026-08-13" }),
      reading({ date: "2026-08-14" }),
      reading({ date: "2026-08-15" }),
    ];
    const { points } = buildChartGeometry(readings, { width: 300, height: 120 });

    expect(points).toHaveLength(3);
    expect(points.map((p) => p.date)).toEqual(["2026-08-13", "2026-08-14", "2026-08-15"]);
    // Centered within each of 3 equal-width slots (100px each).
    expect(points.map((p) => p.x)).toEqual([50, 150, 250]);
  });

  it("centers a single point at width / 2", () => {
    const { points } = buildChartGeometry([reading()], { width: 300, height: 120 });
    expect(points[0].x).toBe(150);
  });

  it("scales the lowest min to the bottom padding and highest max to the top padding", () => {
    const readings = [reading({ min: 10, max: 10 }), reading({ min: 30, max: 30 })];
    const { points } = buildChartGeometry(readings, { width: 200, height: 120, paddingY: 10 });

    // Point 0's max (10, the domain min) sits at the bottom of the plot area.
    expect(points[0].yMax).toBeCloseTo(120 - 10);
    // Point 1's min (30, the domain max) sits at the top of the plot area.
    expect(points[1].yMin).toBeCloseTo(10);
  });

  it("does not divide by zero when every reading is identical", () => {
    const readings = [reading({ min: 20, max: 20, avg: 20 }), reading({ min: 20, max: 20, avg: 20 })];
    const { points } = buildChartGeometry(readings, { width: 200, height: 120 });

    expect(points.every((p) => Number.isFinite(p.yMin) && Number.isFinite(p.yMax))).toBe(true);
  });
});
