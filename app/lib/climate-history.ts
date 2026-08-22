import type { ClimateSummaryReading } from "./climate-summary-api.server";

export type MetricSeries = {
  type: string;
  readings: ClimateSummaryReading[];
};

/** Splits a flat list of daily summaries into one series per metric type,
 * each already sorted by date (the API returns them that way) — types
 * ordered alphabetically so rendering order is stable regardless of which
 * day happened to report first. */
export function groupByType(readings: ClimateSummaryReading[]): MetricSeries[] {
  const byType = new Map<string, ClimateSummaryReading[]>();
  for (const reading of readings) {
    const series = byType.get(reading.type);
    if (series) {
      series.push(reading);
    } else {
      byType.set(reading.type, [reading]);
    }
  }
  return [...byType.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([type, seriesReadings]) => ({ type, readings: seriesReadings }));
}
