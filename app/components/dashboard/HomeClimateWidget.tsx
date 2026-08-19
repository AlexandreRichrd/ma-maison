import { useEffect, useRef, useState } from "react";
import { useRevalidator } from "react-router";

import { Card } from "~/components/ui";
import type { IndoorClimate } from "~/lib/climate-api.server";
import { connectClimateSocket, type ClimateMeasurement } from "~/lib/climate-socket.client";

// Placeholder — no outdoor sensor yet (a Stevenson-screen one is planned,
// see capteurs/README.md). Marked "estimation" in the UI rather than
// dropped, so the layout keeps its two-box shape; not wired to a weather
// API or a real sensor.
const OUTSIDE_TEMP_C = 20;

export function applyMeasurements(
  indoor: IndoorClimate,
  measurements: ClimateMeasurement[],
): IndoorClimate {
  const temperature = measurements.find((m) => m.type === "temperature");
  const humidity = measurements.find((m) => m.type === "humidite");
  const latest = temperature ?? humidity;

  return {
    temperatureC: temperature ? Number(temperature.value) : indoor.temperatureC,
    humidityPercent: humidity ? Number(humidity.value) : indoor.humidityPercent,
    recordedAt: latest ? new Date(latest.recordedAt) : indoor.recordedAt,
    // Just arrived over the socket — current by definition, no need to
    // re-run climate.ts's isStale() against "now" the way the loader does.
    stale: false,
  };
}

export function HomeClimateWidget({ indoor: loaderIndoor }: { indoor: IndoorClimate }) {
  const [indoor, setIndoor] = useState(loaderIndoor);
  // A fresh loader run (navigation, or the reconnect-triggered revalidation
  // below) is always at least as current as whatever the socket built up —
  // let it replace local state rather than merge with it. Adjusted during
  // render (React's documented pattern for resetting state when a prop
  // changes: https://react.dev/learn/you-might-not-need-an-effect), not in
  // an effect, so it doesn't cost an extra render pass.
  const [prevLoaderIndoor, setPrevLoaderIndoor] = useState(loaderIndoor);
  if (loaderIndoor !== prevLoaderIndoor) {
    setPrevLoaderIndoor(loaderIndoor);
    setIndoor(loaderIndoor);
  }

  const revalidator = useRevalidator();
  const revalidateRef = useRef(revalidator.revalidate);
  useEffect(() => {
    revalidateRef.current = revalidator.revalidate;
  });

  useEffect(() => {
    const socket = connectClimateSocket({
      onMeasurement: (measurements) => {
        setIndoor((current) => applyMeasurements(current, measurements));
      },
      onReconnect: () => {
        // Fills the gap that opened while disconnected — SSR data plus
        // socket pushes only cover what happened while connected.
        revalidateRef.current();
      },
      onServerDisconnect: () => {
        // See connectClimateSocket's comment: the socket won't reconnect
        // itself here, so this is the only recovery path. Revalidating
        // hits the API for real — if the access token expired (the only
        // thing that triggers this today), that 401s and apiFetch's
        // existing handler clears the cookies and redirects to /login.
        revalidateRef.current();
      },
    });
    return () => {
      socket.disconnect();
    };
  }, []);

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
