import { describe, expect, it } from "vitest";

import type { IndoorClimate } from "~/lib/climate-api.server";

import { applyMeasurements } from "./HomeClimateWidget";

const baseline: IndoorClimate = {
  temperatureC: 20.5,
  humidityPercent: 45,
  recordedAt: new Date("2026-08-15T09:00:00.000Z"),
  stale: true,
};

describe("applyMeasurements", () => {
  it("updates temperature and humidity together when a broadcast carries both", () => {
    const result = applyMeasurements(baseline, [
      { deviceName: "capteur-salon", type: "temperature", value: "21.3", recordedAt: "2026-08-15T10:00:00.000Z" },
      { deviceName: "capteur-salon", type: "humidite", value: "47.2", recordedAt: "2026-08-15T10:00:00.000Z" },
    ]);

    expect(result).toEqual({
      temperatureC: 21.3,
      humidityPercent: 47.2,
      recordedAt: new Date("2026-08-15T10:00:00.000Z"),
      stale: false,
    });
  });

  it("updates only temperature when a broadcast carries only that type, leaving humidity as-is", () => {
    const result = applyMeasurements(baseline, [
      { deviceName: "capteur-salon", type: "temperature", value: "21.3", recordedAt: "2026-08-15T10:00:00.000Z" },
    ]);

    expect(result.temperatureC).toBe(21.3);
    expect(result.humidityPercent).toBe(baseline.humidityPercent);
    expect(result.stale).toBe(false);
  });

  it("marks the reading as no longer stale, since a live push is current by definition", () => {
    const result = applyMeasurements(baseline, [
      { deviceName: "capteur-salon", type: "humidite", value: "47.2", recordedAt: "2026-08-15T10:00:00.000Z" },
    ]);

    expect(result.stale).toBe(false);
  });
});
