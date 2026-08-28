import type { Settings } from "./settings-api.server";

// Plain module, not settings-api.server.ts — this is a pure function with
// no server-only dependency (no fetch, no cookies), and components that
// render on the client (HouseholdSettingsCard.tsx) need to call it
// directly. A .server.ts file is stripped from the client bundle
// entirely, so importing one from component code breaks the build — see
// https://reactrouter.com/explanation/code-splitting#removal-of-server-code.
const DEFAULT_INDOOR_LABEL = "Intérieur";
const DEFAULT_OUTDOOR_LABEL = "Extérieur";

// Matches HomeClimateWidget.tsx's/climate-api.server.ts's INDOOR_DEVICE/
// OUTDOOR_DEVICE constants — the two known sensor roles this app resolves
// a display label for. Shared here (not duplicated per caller) since the
// Dashboard widget, the /climate/:deviceName history page, and the
// settings form all need the same fallback logic.
export function resolveSensorLabel(deviceName: string, settings: Settings): string {
  if (deviceName === "capteur-salon") {
    return settings.indoorSensorLabel ?? DEFAULT_INDOOR_LABEL;
  }
  if (deviceName === "capteur-exterieur") {
    return settings.outdoorSensorLabel ?? DEFAULT_OUTDOOR_LABEL;
  }
  return deviceName;
}
