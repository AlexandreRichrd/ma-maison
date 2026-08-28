import { data } from "react-router";

import { DailyHistoryChart } from "~/components/climate/DailyHistoryChart";
import { PageHeader } from "~/components/layout/PageHeader";
import { cardClassName } from "~/components/ui";
import { groupByType } from "~/lib/climate-history";
import { getClimateSummaries } from "~/lib/climate-summary-api.server";
import { getCurrentIsoDate, shiftIsoDate } from "~/lib/day";
import { resolveSensorLabel } from "~/lib/sensor-labels";
import { getSettings } from "~/lib/settings-api.server";

import type { Route } from "./+types/climate.$deviceName";

// Matches HomeClimateWidget's INDOOR_DEVICE/OUTDOOR_DEVICE — also the set
// of valid :deviceName values for this route (anything else 404s). The
// display label itself comes from resolveSensorLabel() (issue #12), not a
// hardcoded map — this is only the validity check.
const VALID_DEVICE_NAMES = new Set(["capteur-salon", "capteur-exterieur"]);

const METRIC_LABELS: Record<string, { label: string; unit: string }> = {
  temperature: { label: "Température", unit: "°C" },
  humidite: { label: "Humidité", unit: "%" },
  batterie: { label: "Batterie", unit: "%" },
};

// Long-range history is exactly what daily_summaries exists for — raw
// measures are only kept CLIMATE_SUMMARY_RETENTION_DAYS (7 by default), so
// this window is deliberately much longer than that. No date-range
// navigation for now — see the top-level repo's CLAUDE.md task notes on
// keeping the chart simple.
const HISTORY_DAYS = 30;

export function meta({ params, loaderData }: Route.MetaArgs) {
  const label = loaderData?.label ?? params.deviceName;
  return [{ title: `${label} · Climat · Hearth` }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  if (!VALID_DEVICE_NAMES.has(params.deviceName)) {
    throw data("Introuvable", { status: 404 });
  }

  const to = getCurrentIsoDate();
  const from = shiftIsoDate(to, -(HISTORY_DAYS - 1));
  const [readings, settings] = await Promise.all([
    getClimateSummaries(request, params.deviceName, from, to),
    getSettings(request),
  ]);

  return {
    deviceName: params.deviceName,
    label: resolveSensorLabel(params.deviceName, settings),
    series: groupByType(readings),
  };
}

export default function ClimateDeviceHistory({ loaderData }: Route.ComponentProps) {
  const { deviceName, label, series } = loaderData;

  return (
    <div>
      <PageHeader
        back={{ to: "/", label: "← Tableau de bord" }}
        title={label}
        subtitle={`Min / max / moyenne par jour, ${HISTORY_DAYS} derniers jours`}
      />
      <div className="flex flex-col gap-4">
        {series.length === 0 ? (
          <div className={cardClassName}>
            <p className="text-sm text-muted">Aucune donnée pour cette période.</p>
          </div>
        ) : (
          series.map((metricSeries) => {
            const metric = METRIC_LABELS[metricSeries.type] ?? {
              label: metricSeries.type,
              unit: "",
            };
            return (
              <div key={metricSeries.type} className={cardClassName}>
                <h2 className="mb-3.5 font-serif text-lg font-semibold">{metric.label}</h2>
                <DailyHistoryChart
                  readings={metricSeries.readings}
                  unit={metric.unit}
                  tone={deviceName === "capteur-exterieur" ? "outside" : "inside"}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
