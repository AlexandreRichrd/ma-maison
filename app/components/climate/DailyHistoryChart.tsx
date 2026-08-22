import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { buildChartGeometry } from "~/lib/climate-history";
import type { ClimateSummaryReading } from "~/lib/climate-summary-api.server";
import { parseIsoDate } from "~/lib/day";

const CHART_WIDTH = 600;
const CHART_HEIGHT = 140;
const PADDING_Y = 16;

function formatDayLabel(isoDate: string): string {
  return format(parseIsoDate(isoDate), "d MMM", { locale: fr });
}

/**
 * One point per day: a vertical line for the min-max range, a dot for the
 * average — no charting library, the data is simple enough (one reading
 * per day per metric) for a hand-rolled SVG. `accentClassName` sets the
 * mark color via `currentColor` (e.g. one of the climate-inside-… /
 * climate-outside-… tokens `HomeClimateWidget` already uses), so this
 * component stays device-agnostic.
 */
export function DailyHistoryChart({
  readings,
  unit,
  accentClassName = "text-accent",
}: {
  readings: ClimateSummaryReading[];
  unit: string;
  accentClassName?: string;
}) {
  if (readings.length === 0) {
    return <p className="text-sm text-muted">Pas encore de données pour cette période.</p>;
  }

  const { points, domainMin, domainMax } = buildChartGeometry(readings, {
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
    paddingY: PADDING_Y,
  });

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs text-muted">
        <span>
          {domainMax !== null ? `${domainMax.toFixed(1)} ${unit}` : ""}
        </span>
        <span>
          {domainMin !== null ? `${domainMin.toFixed(1)} ${unit}` : ""}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className={`w-full ${accentClassName}`}
        role="img"
        aria-label={`Historique quotidien (${unit}), du ${formatDayLabel(points[0].date)} au ${formatDayLabel(points[points.length - 1].date)}`}
      >
        {points.map((point, index) => {
          const reading = readings[index];
          return (
            <g key={point.date}>
              <line
                x1={point.x}
                x2={point.x}
                y1={point.yMin}
                y2={point.yMax}
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                opacity={0.5}
              />
              <circle cx={point.x} cy={point.yAvg} r={3.5} fill="currentColor" />
              <title>
                {`${formatDayLabel(reading.date)} : ${reading.min.toFixed(1)}–${reading.max.toFixed(1)} ${unit}, moy. ${reading.avg.toFixed(1)} ${unit}`}
              </title>
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-xs text-muted">
        <span>{formatDayLabel(points[0].date)}</span>
        {points.length > 1 && <span>{formatDayLabel(points[points.length - 1].date)}</span>}
      </div>
    </div>
  );
}
