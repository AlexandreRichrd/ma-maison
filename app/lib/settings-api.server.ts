import { apiFetch } from "./api.server";
import { getAccessToken } from "./auth.server";

export type Settings = {
  climateAlertEnabled: boolean;
  climateAlertMarginC: number;
  climateAlertIndoorThresholdC: number;
  climateAlertCooldownMinutes: number;
  climateSummaryRetentionDays: number;
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
};

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
    },
  });
}
