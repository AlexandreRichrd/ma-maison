import { Card } from "~/components/ui";
import type { IndoorClimate } from "~/lib/climate-api.server";

// Placeholder — no outdoor sensor yet (a Stevenson-screen one is planned,
// see capteurs/README.md). Marked "estimation" in the UI rather than
// dropped, so the layout keeps its two-box shape; not wired to a weather
// API or a real sensor.
const OUTSIDE_TEMP_C = 20;

export function HomeClimateWidget({ indoor }: { indoor: IndoorClimate }) {
  const hasReading = indoor.temperatureC !== null && indoor.humidityPercent !== null;

  return (
    <Card className="sm:col-span-2">
      <h2 className="mb-3.5 font-serif text-lg font-semibold">Climat de la maison</h2>
      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2">
        <div className="flex items-center gap-3.5 rounded-xl bg-climate-outside-bg px-4 py-3.5">
          <div className="size-10 shrink-0 rounded-full bg-climate-outside-icon" />
          <div>
            <div className="mb-0.5 text-xs font-semibold tracking-wide text-climate-outside-text uppercase">
              Extérieur (estimation)
            </div>
            <div className="font-serif text-xl font-bold">{OUTSIDE_TEMP_C}°C</div>
          </div>
        </div>
        <div className="flex items-center gap-3.5 rounded-xl bg-climate-inside-bg px-4 py-3.5">
          <div className="size-10 shrink-0 rounded-full bg-climate-inside-icon" />
          <div>
            <div className="mb-0.5 text-xs font-semibold tracking-wide text-climate-inside-text uppercase">
              Intérieur
            </div>
            {hasReading ? (
              <>
                <div className="flex items-baseline gap-2.5">
                  <div className="font-serif text-xl font-bold">
                    {indoor.temperatureC?.toFixed(1)}°C
                  </div>
                  <div className="text-sm font-semibold text-climate-inside-text-muted">
                    {indoor.humidityPercent?.toFixed(0)}% d&rsquo;humidité
                  </div>
                </div>
                {indoor.stale && (
                  <div className="mt-0.5 text-xs text-muted">
                    Capteur injoignable — dernière lecture non récente
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-muted">Aucune donnée du capteur intérieur</div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
