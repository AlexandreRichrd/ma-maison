import { useFetcher } from "react-router";

import { Card } from "~/components/ui";
import type { HouseholdMember } from "~/lib/household-api.server";

export function PersonalPreferencesCard({ user }: { user: HouseholdMember }) {
  const fetcher = useFetcher();
  const checked =
    fetcher.state !== "idle" ? !user.receiveClimateAlerts : user.receiveClimateAlerts;

  function toggle() {
    const formData = new FormData();
    formData.set("intent", "updateNotificationPreference");
    formData.set("receiveClimateAlerts", checked ? "false" : "true");
    void fetcher.submit(formData, { method: "post" });
  }

  return (
    <Card id="personal-preferences" className="mt-5 scroll-mt-5">
      <h2 className="mb-3.5 font-serif text-lg font-semibold">Mes préférences</h2>
      <label className="flex min-h-11 cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={toggle}
          className="size-5 shrink-0 accent-accent"
        />
        <span>Recevoir les alertes climat</span>
      </label>
    </Card>
  );
}
