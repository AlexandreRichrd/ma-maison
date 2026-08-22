import { apiFetch } from "./api.server";
import { getAccessToken } from "./auth.server";

type ClimateSummaryDto = {
  type: string;
  date: string;
  min: string;
  max: string;
  avg: string;
  sampleCount: number;
};

export type ClimateSummaryReading = {
  type: string;
  // 'YYYY-MM-DD', a Europe/Paris calendar day — see
  // my-home-backend/CLAUDE.md's Daily summaries and retention section.
  date: string;
  min: number;
  max: number;
  avg: number;
  sampleCount: number;
};

// One fetch of /climate/summaries for a device over [from, to] — the
// per-sensor history view's only data source.
export async function getClimateSummaries(
  request: Request,
  deviceName: string,
  from: string,
  to: string,
): Promise<ClimateSummaryReading[]> {
  const accessToken = await getAccessToken(request);
  const params = new URLSearchParams({ deviceName, from, to });
  const rows = await apiFetch<ClimateSummaryDto[]>(`/climate/summaries?${params}`, {
    accessToken,
  });

  return rows.map((row) => ({
    type: row.type,
    date: row.date.slice(0, 10),
    min: Number(row.min),
    max: Number(row.max),
    avg: Number(row.avg),
    sampleCount: row.sampleCount,
  }));
}
