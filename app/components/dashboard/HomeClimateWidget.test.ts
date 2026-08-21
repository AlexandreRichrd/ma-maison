import { describe, expect, it } from "vitest";

import type { IndoorClimate, OutdoorClimate } from "~/lib/climate-api.server";

import { applyMeasurements, type HomeClimate } from "./HomeClimateWidget";

const baselineIndoor: IndoorClimate = {
  temperatureC: 20.5,
  humidityPercent: 45,
  recordedAt: new Date("2026-08-15T09:00:00.000Z"),
  stale: true,
};

const baselineOutdoor: OutdoorClimate = {
  temperatureC: 15.2,
  recordedAt: new Date("2026-08-15T09:00:00.000Z"),
  stale: true,
};

const baseline: HomeClimate = { indoor: baselineIndoor, outdoor: baselineOutdoor };

describe("applyMeasurements", () => {
  it("updates indoor temperature and humidity together when a broadcast carries both", () => {
    const result = applyMeasurements(baseline, [
      {
        deviceName: "capteur-salon",
        type: "temperature",
        value: "21.3",
        recordedAt: "2026-08-15T10:00:00.000Z",
      },
      {
        deviceName: "capteur-salon",
        type: "humidite",
        value: "47.2",
        recordedAt: "2026-08-15T10:00:00.000Z",
      },
    ]);

    expect(result.indoor).toEqual({
      temperatureC: 21.3,
      humidityPercent: 47.2,
      recordedAt: new Date("2026-08-15T10:00:00.000Z"),
      stale: false,
    });
    expect(result.outdoor).toEqual(baselineOutdoor);
  });

  it("updates only indoor temperature when a broadcast carries only that type, leaving humidity as-is", () => {
    const result = applyMeasurements(baseline, [
      {
        deviceName: "capteur-salon",
        type: "temperature",
        value: "21.3",
        recordedAt: "2026-08-15T10:00:00.000Z",
      },
    ]);

    expect(result.indoor.temperatureC).toBe(21.3);
    expect(result.indoor.humidityPercent).toBe(baselineIndoor.humidityPercent);
    expect(result.indoor.stale).toBe(false);
  });

  it("marks the indoor reading as no longer stale, since a live push is current by definition", () => {
    const result = applyMeasurements(baseline, [
      {
        deviceName: "capteur-salon",
        type: "humidite",
        value: "47.2",
        recordedAt: "2026-08-15T10:00:00.000Z",
      },
    ]);

    expect(result.indoor.stale).toBe(false);
  });

  it("updates the outdoor temperature from a capteur-exterieur broadcast, leaving indoor untouched", () => {
    const result = applyMeasurements(baseline, [
      {
        deviceName: "capteur-exterieur",
        type: "temperature",
        value: "16.8",
        recordedAt: "2026-08-15T10:00:00.000Z",
      },
    ]);

    expect(result.outdoor).toEqual({
      temperatureC: 16.8,
      recordedAt: new Date("2026-08-15T10:00:00.000Z"),
      stale: false,
    });
    expect(result.indoor).toEqual(baselineIndoor);
  });

  it("ignores an outdoor batterie reading, since only temperature is rendered", () => {
    const result = applyMeasurements(baseline, [
      {
        deviceName: "capteur-exterieur",
        type: "batterie",
        value: "87",
        recordedAt: "2026-08-15T10:00:00.000Z",
      },
    ]);

    expect(result.outdoor).toEqual(baselineOutdoor);
  });

  it("leaves a device's stale flag untouched when a broadcast only carries the other device's reading", () => {
    const result = applyMeasurements(baseline, [
      {
        deviceName: "capteur-exterieur",
        type: "temperature",
        value: "16.8",
        recordedAt: "2026-08-15T10:00:00.000Z",
      },
    ]);

    expect(result.indoor.stale).toBe(baselineIndoor.stale);
  });
});
