import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Line } from "react-chartjs-2";

import type { ClimateSummaryReading } from "~/lib/climate-summary-api.server";
import { parseIsoDate } from "~/lib/day";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

function formatDayLabel(isoDate: string): string {
  return format(parseIsoDate(isoDate), "d MMM", { locale: fr });
}

// Mirrors app.css's --color-climate-inside-*/--color-climate-outside-*
// tokens — duplicated as literal oklch() values (valid canvas colors)
// rather than read from CSS at runtime, since Chart.js draws on a
// <canvas>, not through the DOM/Tailwind. Keep in sync with app.css if
// those tokens change.
const TONE_COLORS = {
  inside: { line: "oklch(42% 0.03 140)", band: "oklch(78% 0.1 140 / 30%)", edge: "oklch(78% 0.1 140 / 60%)" },
  outside: { line: "oklch(45% 0.02 220)", band: "oklch(80% 0.08 220 / 30%)", edge: "oklch(80% 0.08 220 / 60%)" },
} as const;

/**
 * One line per metric: daily average as a solid curve, with a shaded
 * min-max band behind it — Chart.js gives real, labeled axes and
 * gridlines for free, which a hand-rolled SVG was falling short on.
 */
export function DailyHistoryChart({
  readings,
  unit,
  tone = "inside",
}: {
  readings: ClimateSummaryReading[];
  unit: string;
  tone?: "inside" | "outside";
}) {
  if (readings.length === 0) {
    return <p className="text-sm text-muted">Pas encore de données pour cette période.</p>;
  }

  const colors = TONE_COLORS[tone];
  const labels = readings.map((reading) => formatDayLabel(reading.date));

  const data = {
    labels,
    datasets: [
      {
        label: "Max",
        data: readings.map((reading) => reading.max),
        borderColor: colors.edge,
        borderWidth: 1,
        pointRadius: 0,
        tension: 0.3,
        fill: false,
      },
      {
        label: "Min",
        data: readings.map((reading) => reading.min),
        borderColor: colors.edge,
        borderWidth: 1,
        pointRadius: 0,
        tension: 0.3,
        backgroundColor: colors.band,
        fill: "-1" as const,
      },
      {
        label: "Moyenne",
        data: readings.map((reading) => reading.avg),
        borderColor: colors.line,
        backgroundColor: colors.line,
        borderWidth: 2.5,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.3,
        fill: false,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { position: "top", labels: { boxHeight: 8, boxWidth: 8, usePointStyle: true } },
      tooltip: {
        callbacks: {
          label: (item) => `${item.dataset.label} : ${item.formattedValue} ${unit}`,
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        title: { display: true, text: unit },
        grid: { color: "oklch(90% 0 0)" },
      },
    },
  };

  return (
    <div style={{ height: 220 }}>
      <Line data={data} options={options} />
    </div>
  );
}
