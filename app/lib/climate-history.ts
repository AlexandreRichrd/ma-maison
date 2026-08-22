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

export type ChartPoint = {
  date: string;
  x: number;
  yMin: number;
  yMax: number;
  yAvg: number;
};

export type ChartGeometry = {
  points: ChartPoint[];
  width: number;
  height: number;
  domainMin: number | null;
  domainMax: number | null;
};

/** Maps a metric's daily min/max/avg onto SVG coordinates — one point per
 * day, evenly spaced along x; y scaled to the series' own min/max range
 * with a little padding so the plotted range never touches the edges. Pure
 * so it's testable without rendering anything. */
export function buildChartGeometry(
  readings: ClimateSummaryReading[],
  { width, height, paddingY = 12 }: { width: number; height: number; paddingY?: number },
): ChartGeometry {
  if (readings.length === 0) {
    return { points: [], width, height, domainMin: null, domainMax: null };
  }

  const allMins = readings.map((r) => r.min);
  const allMaxs = readings.map((r) => r.max);
  const domainMin = Math.min(...allMins);
  const domainMax = Math.max(...allMaxs);
  // A flat series (every reading identical) would otherwise divide by
  // zero — fall back to a fixed 1-unit span centered on the value.
  const span = domainMax - domainMin || 1;

  const plotHeight = height - paddingY * 2;
  function scaleY(value: number): number {
    return paddingY + plotHeight * (1 - (value - domainMin) / span);
  }

  const step = readings.length === 1 ? 0 : width / readings.length;
  const points = readings.map((reading, index) => ({
    date: reading.date,
    x: readings.length === 1 ? width / 2 : step * index + step / 2,
    yMin: scaleY(reading.min),
    yMax: scaleY(reading.max),
    yAvg: scaleY(reading.avg),
  }));

  return { points, width, height, domainMin, domainMax };
}
