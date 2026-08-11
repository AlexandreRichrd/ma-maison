import { Card } from "~/components/ui";

// Placeholder values — no weather API or indoor sensor is wired up yet.
const OUTSIDE_TEMP_C = 20;
const INSIDE_TEMP_C = 22;
const INSIDE_HUMIDITY_PERCENT = 44;

export function HomeClimateWidget() {
  return (
    <Card className="sm:col-span-2">
      <h2 className="mb-3.5 font-serif text-lg font-semibold">Climat de la maison</h2>
      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2">
        <div className="flex items-center gap-3.5 rounded-xl bg-climate-outside-bg px-4 py-3.5">
          <div className="size-10 shrink-0 rounded-full bg-climate-outside-icon" />
          <div>
            <div className="mb-0.5 text-xs font-semibold tracking-wide text-climate-outside-text uppercase">
              Extérieur
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
            <div className="flex items-baseline gap-2.5">
              <div className="font-serif text-xl font-bold">{INSIDE_TEMP_C}°C</div>
              <div className="text-sm font-semibold text-climate-inside-text-muted">
                {INSIDE_HUMIDITY_PERCENT}% d&rsquo;humidité
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
