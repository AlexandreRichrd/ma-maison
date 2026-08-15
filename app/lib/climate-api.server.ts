import { apiFetch } from "./api.server";
import { getAccessToken } from "./auth.server";
import { isStale } from "./climate";

type ClimateReadingDto = {
  deviceName: string;
  type: string;
  value: string;
  recordedAt: string;
};

export type IndoorClimate = {
  temperatureC: number | null;
  humidityPercent: number | null;
  recordedAt: Date | null;
  stale: boolean;
};

// Only one indoor sensor exists today (capteur-salon), so this collapses
// straight to a single reading instead of grouping by device — the widget
// has nowhere to show more than one indoor value yet. Once a second indoor
// sensor shows up, this needs per-room grouping instead.
export async function getIndoorClimate(request: Request): Promise<IndoorClimate> {
  const accessToken = await getAccessToken(request);
  const readings = await apiFetch<ClimateReadingDto[]>("/climate/current", { accessToken });

  const temperature = readings.find((r) => r.type === "temperature");
  const humidity = readings.find((r) => r.type === "humidite");

  // The older of the two timestamps, if both are present — a fresh
  // temperature paired with a stale humidity (or vice versa) should still
  // read as "not live" rather than hiding the stale half.
  const recordedAt = [temperature, humidity]
    .filter((reading): reading is ClimateReadingDto => reading !== undefined)
    .map((reading) => new Date(reading.recordedAt))
    .sort((a, b) => a.getTime() - b.getTime())[0];

  return {
    temperatureC: temperature ? Number(temperature.value) : null,
    humidityPercent: humidity ? Number(humidity.value) : null,
    recordedAt: recordedAt ?? null,
    stale: recordedAt === undefined || isStale(recordedAt, new Date()),
  };
}
