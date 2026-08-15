// A reading older than this is shown as "not live" rather than trusted at
// face value — readings normally land about once a minute (see
// capteurs/README.md's Cadence de mesure), so this tolerates a couple of
// missed forward cycles before flagging the sensor as offline/stale.
const STALE_THRESHOLD_MINUTES = 5;

export function isStale(recordedAt: Date, now: Date): boolean {
  const ageMinutes = (now.getTime() - recordedAt.getTime()) / 60_000;
  return ageMinutes > STALE_THRESHOLD_MINUTES;
}
