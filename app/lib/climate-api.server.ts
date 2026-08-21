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

// DS18B20 probes only report temperature — no humidity outdoors. The
// device is battery-powered, so a battery level rides alongside it —
// already a percentage on arrival, converted from raw voltage on-device
// by capteur-exterieur.yaml's calibrate_linear filter, not here.
export type OutdoorClimate = {
  temperatureC: number | null;
  batteryPercent: number | null;
  recordedAt: Date | null;
  stale: boolean;
};

export type HomeClimate = {
  indoor: IndoorClimate;
  outdoor: OutdoorClimate;
};

const INDOOR_DEVICE = "capteur-salon";
const OUTDOOR_DEVICE = "capteur-exterieur";

// One fetch of /climate/current, split by deviceName — cheaper than a
// round trip per sensor and keeps indoor/outdoor readings from the same
// instant.
export async function getHomeClimate(request: Request): Promise<HomeClimate> {
  const accessToken = await getAccessToken(request);
  const readings = await apiFetch<ClimateReadingDto[]>("/climate/current", { accessToken });

  return {
    indoor: buildIndoorClimate(readings),
    outdoor: buildOutdoorClimate(readings),
  };
}

function buildIndoorClimate(readings: ClimateReadingDto[]): IndoorClimate {
  const indoorReadings = readings.filter((r) => r.deviceName === INDOOR_DEVICE);
  const temperature = indoorReadings.find((r) => r.type === "temperature");
  const humidity = indoorReadings.find((r) => r.type === "humidite");

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

function buildOutdoorClimate(readings: ClimateReadingDto[]): OutdoorClimate {
  const outdoorReadings = readings.filter((r) => r.deviceName === OUTDOOR_DEVICE);
  const temperature = outdoorReadings.find((r) => r.type === "temperature");
  const battery = outdoorReadings.find((r) => r.type === "batterie");

  // The older of the two timestamps, if both are present — same reasoning
  // as buildIndoorClimate's temperature/humidity pairing.
  const recordedAt = [temperature, battery]
    .filter((reading): reading is ClimateReadingDto => reading !== undefined)
    .map((reading) => new Date(reading.recordedAt))
    .sort((a, b) => a.getTime() - b.getTime())[0];

  return {
    temperatureC: temperature ? Number(temperature.value) : null,
    batteryPercent: battery ? Number(battery.value) : null,
    recordedAt: recordedAt ?? null,
    stale: recordedAt === undefined || isStale(recordedAt, new Date()),
  };
}
