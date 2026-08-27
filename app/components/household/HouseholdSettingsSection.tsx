import { useState } from "react";
import { useFetcher } from "react-router";

import { Button, Card, Input, Modal } from "~/components/ui";
import type { Settings } from "~/lib/settings-api.server";

/** Reused for both display (rendered) and the modal's inputs (name/defaultValue). */
function SettingsFormFields({
  settings,
  enabled,
  onEnabledChange,
  fieldErrors,
}: {
  settings: Settings;
  enabled: boolean;
  onEnabledChange: (value: boolean) => void;
  fieldErrors: Record<string, string[]> | undefined;
}) {
  const errorFor = (field: string) =>
    fieldErrors && field in fieldErrors ? (
      <p className="text-sm font-medium text-accent" role="alert">
        {fieldErrors[field][0]}
      </p>
    ) : null;

  return (
    <>
      {/* Mirrors `enabled` as an explicit true/false string — an unchecked
          native checkbox omits itself from FormData entirely, which a
          partial-update PATCH can't distinguish from "leave unchanged". */}
      <input type="hidden" name="climateAlertEnabled" value={enabled ? "true" : "false"} />
      <label className="flex min-h-11 cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => onEnabledChange(event.target.checked)}
          className="size-5 shrink-0 accent-accent"
        />
        <span>Activer l’alerte climat</span>
      </label>
      {errorFor("climateAlertEnabled")}
      <Input
        label="Écart minimum extérieur/intérieur (°C)"
        name="climateAlertMarginC"
        type="number"
        min={0}
        step={0.1}
        defaultValue={settings.climateAlertMarginC}
        required
      />
      {errorFor("climateAlertMarginC")}
      <Input
        label="Seuil de confort intérieur (°C)"
        name="climateAlertIndoorThresholdC"
        type="number"
        min={0}
        step={0.1}
        defaultValue={settings.climateAlertIndoorThresholdC}
        required
      />
      {errorFor("climateAlertIndoorThresholdC")}
      <Input
        label="Délai avant rappel (minutes)"
        name="climateAlertCooldownMinutes"
        type="number"
        min={1}
        step={1}
        defaultValue={settings.climateAlertCooldownMinutes}
        required
      />
      {errorFor("climateAlertCooldownMinutes")}
      <Input
        label="Conservation des mesures brutes (jours)"
        name="climateSummaryRetentionDays"
        type="number"
        min={1}
        step={1}
        defaultValue={settings.climateSummaryRetentionDays}
        required
      />
      {errorFor("climateSummaryRetentionDays")}
    </>
  );
}

export function HouseholdSettingsSection({ settings }: { settings: Settings }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [enabled, setEnabled] = useState(settings.climateAlertEnabled);
  const fetcher = useFetcher();

  const fieldErrors =
    fetcher.data && "errors" in fetcher.data
      ? (fetcher.data.errors as Record<string, string[]>)
      : undefined;
  const generalError =
    fieldErrors && "general" in fieldErrors ? fieldErrors.general[0] : undefined;

  function openModal() {
    setEnabled(settings.climateAlertEnabled);
    setModalOpen(true);
  }

  return (
    <Card className="mt-5">
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold">Paramètres</h2>
        <Button variant="secondary" onClick={openModal}>
          Modifier
        </Button>
      </div>

      <div className="rounded-lg bg-surface px-3 py-2.5 text-sm font-medium text-muted">
        Alerte climat : {settings.climateAlertEnabled ? "activée" : "désactivée"} · écart{" "}
        {settings.climateAlertMarginC}°C · seuil {settings.climateAlertIndoorThresholdC}°C ·
        délai {settings.climateAlertCooldownMinutes} min
        <br />
        Conservation des mesures : {settings.climateSummaryRetentionDays} jours
      </div>
      {/* Whether *this* household member receives the climate alert email
          is a personal preference, not a shared value — edited from
          /account (click your own name in the sidebar), not here. */}

      <Modal
        open={modalOpen}
        title="Modifier les paramètres"
        onClose={() => setModalOpen(false)}
        fetcher={fetcher}
      >
        <input type="hidden" name="intent" value="updateSettings" />
        {generalError && (
          <p className="text-sm font-medium text-accent" role="alert">
            {generalError}
          </p>
        )}
        <SettingsFormFields
          settings={settings}
          enabled={enabled}
          onEnabledChange={setEnabled}
          fieldErrors={fieldErrors}
        />
      </Modal>
    </Card>
  );
}
