import { apiFetch } from "./api.server";
import { getAccessToken } from "./auth.server";

export type Settings = {
  climateAlertEnabled: boolean;
  climateAlertMarginC: number;
  climateAlertIndoorThresholdC: number;
  climateAlertCooldownMinutes: number;
  climateSummaryRetentionDays: number;
  // null means no household-chosen label yet — resolveSensorLabel() below
  // falls back to the hardcoded default (issue #12).
  indoorSensorLabel: string | null;
  outdoorSensorLabel: string | null;
};

export type SettingsFormInput = {
  climateAlertEnabled: boolean;
  // Arrive as strings from form data — converted to real JSON numbers
  // here, since the API's @IsNumber()/@IsInt() need one (same pattern as
  // chores-api.server.ts's ChoreConfigInput/toRequestBody).
  climateAlertMarginC: string;
  climateAlertIndoorThresholdC: string;
  climateAlertCooldownMinutes: string;
  climateSummaryRetentionDays: string;
  // Empty string means "clear the override back to default" — see
  // SettingsService.update() on the API side.
  indoorSensorLabel: string;
  outdoorSensorLabel: string;
};

const DEFAULT_INDOOR_LABEL = "Intérieur";
const DEFAULT_OUTDOOR_LABEL = "Extérieur";

// Matches HomeClimateWidget.tsx's/climate-api.server.ts's INDOOR_DEVICE/
// OUTDOOR_DEVICE constants — the two known sensor roles this app resolves
// a display label for. Shared here (not duplicated per caller) since both
// the Dashboard widget and the /climate/:deviceName history page need the
// same fallback logic.
export function resolveSensorLabel(deviceName: string, settings: Settings): string {
  if (deviceName === "capteur-salon") {
    return settings.indoorSensorLabel ?? DEFAULT_INDOOR_LABEL;
  }
  if (deviceName === "capteur-exterieur") {
    return settings.outdoorSensorLabel ?? DEFAULT_OUTDOOR_LABEL;
  }
  return deviceName;
}

export async function getSettings(request: Request): Promise<Settings> {
  const accessToken = await getAccessToken(request);
  return apiFetch<Settings>("/settings", { accessToken });
}

export async function updateSettings(
  request: Request,
  input: SettingsFormInput,
): Promise<Settings> {
  const accessToken = await getAccessToken(request);
  return apiFetch<Settings>("/settings", {
    method: "PATCH",
    accessToken,
    body: {
      climateAlertEnabled: input.climateAlertEnabled,
      climateAlertMarginC: Number(input.climateAlertMarginC),
      climateAlertIndoorThresholdC: Number(input.climateAlertIndoorThresholdC),
      climateAlertCooldownMinutes: Number(input.climateAlertCooldownMinutes),
      climateSummaryRetentionDays: Number(input.climateSummaryRetentionDays),
      indoorSensorLabel: input.indoorSensorLabel,
      outdoorSensorLabel: input.outdoorSensorLabel,
    },
  });
}
