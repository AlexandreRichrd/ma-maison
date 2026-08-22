import { useEffect, useRef, useState } from "react";
import { Link, useRevalidator } from "react-router";

import { Card } from "~/components/ui";
import type { IndoorClimate, OutdoorClimate } from "~/lib/climate-api.server";
import { connectClimateSocket, type ClimateMeasurement } from "~/lib/climate-socket.client";

const INDOOR_DEVICE = "capteur-salon";
const OUTDOOR_DEVICE = "capteur-exterieur";

export type HomeClimate = {
  indoor: IndoorClimate;
  outdoor: OutdoorClimate;
};

export function applyMeasurements(
  climate: HomeClimate,
  measurements: ClimateMeasurement[],
): HomeClimate {
  const indoorMeasurements = measurements.filter((m) => m.deviceName === INDOOR_DEVICE);
  const temperature = indoorMeasurements.find((m) => m.type === "temperature");
  const humidity = indoorMeasurements.find((m) => m.type === "humidite");
  const indoorLatest = temperature ?? humidity;

  const outdoorMeasurements = measurements.filter((m) => m.deviceName === OUTDOOR_DEVICE);
  const outdoorTemperature = outdoorMeasurements.find((m) => m.type === "temperature");
  const outdoorBattery = outdoorMeasurements.find((m) => m.type === "batterie");
  const outdoorLatest = outdoorTemperature ?? outdoorBattery;

  return {
    indoor: {
      temperatureC: temperature ? Number(temperature.value) : climate.indoor.temperatureC,
      humidityPercent: humidity ? Number(humidity.value) : climate.indoor.humidityPercent,
      recordedAt: indoorLatest ? new Date(indoorLatest.recordedAt) : climate.indoor.recordedAt,
      // Just arrived over the socket — current by definition, no need to
      // re-run climate.ts's isStale() against "now" the way the loader
      // does. A broadcast carrying only the other device's reading leaves
      // this one's stale flag untouched rather than clearing it.
      stale: indoorLatest ? false : climate.indoor.stale,
    },
    outdoor: {
      temperatureC: outdoorTemperature
        ? Number(outdoorTemperature.value)
        : climate.outdoor.temperatureC,
      batteryPercent: outdoorBattery
        ? Number(outdoorBattery.value)
        : climate.outdoor.batteryPercent,
      recordedAt: outdoorLatest ? new Date(outdoorLatest.recordedAt) : climate.outdoor.recordedAt,
      stale: outdoorLatest ? false : climate.outdoor.stale,
    },
  };
}

export function HomeClimateWidget({
  indoor: loaderIndoor,
  outdoor: loaderOutdoor,
}: {
  indoor: IndoorClimate;
  outdoor: OutdoorClimate;
}) {
  const [climate, setClimate] = useState<HomeClimate>({
    indoor: loaderIndoor,
    outdoor: loaderOutdoor,
  });
  // A fresh loader run (navigation, or the reconnect-triggered revalidation
  // below) is always at least as current as whatever the socket built up —
  // let it replace local state rather than merge with it. Adjusted during
  // render (React's documented pattern for resetting state when a prop
  // changes: https://react.dev/learn/you-might-not-need-an-effect), not in
  // an effect, so it doesn't cost an extra render pass.
  const [prevLoaderIndoor, setPrevLoaderIndoor] = useState(loaderIndoor);
  const [prevLoaderOutdoor, setPrevLoaderOutdoor] = useState(loaderOutdoor);
  if (loaderIndoor !== prevLoaderIndoor || loaderOutdoor !== prevLoaderOutdoor) {
    setPrevLoaderIndoor(loaderIndoor);
    setPrevLoaderOutdoor(loaderOutdoor);
    setClimate({ indoor: loaderIndoor, outdoor: loaderOutdoor });
  }

  const revalidator = useRevalidator();
  const revalidateRef = useRef(revalidator.revalidate);
  useEffect(() => {
    revalidateRef.current = revalidator.revalidate;
  });

  useEffect(() => {
    const socket = connectClimateSocket({
      onMeasurement: (measurements) => {
        setClimate((current) => applyMeasurements(current, measurements));
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

  const { indoor, outdoor } = climate;
  const hasIndoorReading = indoor.temperatureC !== null && indoor.humidityPercent !== null;
  const hasOutdoorReading = outdoor.temperatureC !== null && outdoor.batteryPercent !== null;

  return (
    <Card className="sm:col-span-2">
      <h2 className="mb-3.5 font-serif text-lg font-semibold">Climat de la maison</h2>
      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2">
        <Link
          to="/climate/capteur-exterieur"
          className="flex items-center gap-3.5 rounded-xl bg-climate-outside-bg px-4 py-3.5 transition-opacity hover:opacity-90"
        >
          <div className="size-10 shrink-0 rounded-full bg-climate-outside-icon" />
          <div>
            <div className="mb-0.5 text-xs font-semibold tracking-wide text-climate-outside-text uppercase">
              Extérieur
            </div>
            {hasOutdoorReading ? (
              <>
                <div className="flex items-baseline gap-2.5">
                  <div className="font-serif text-xl font-bold">
                    {outdoor.temperatureC?.toFixed(1)}°C
                  </div>
                  <div className="text-sm font-semibold text-climate-outside-text-muted">
                    {outdoor.batteryPercent?.toFixed(0)}% batterie
                  </div>
                </div>
                {outdoor.stale && (
                  <div className="mt-0.5 text-xs text-muted">
                    Capteur injoignable — dernière lecture non récente
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-muted">Aucune donnée du capteur extérieur</div>
            )}
          </div>
        </Link>
        <Link
          to="/climate/capteur-salon"
          className="flex items-center gap-3.5 rounded-xl bg-climate-inside-bg px-4 py-3.5 transition-opacity hover:opacity-90"
        >
          <div className="size-10 shrink-0 rounded-full bg-climate-inside-icon" />
          <div>
            <div className="mb-0.5 text-xs font-semibold tracking-wide text-climate-inside-text uppercase">
              Intérieur
            </div>
            {hasIndoorReading ? (
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
        </Link>
      </div>
    </Card>
  );
}
