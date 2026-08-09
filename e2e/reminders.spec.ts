import { expect, test } from "@playwright/test";

import { login } from "./utils";

test.beforeEach(async ({ page }) => {
  await login(page);
});

test("toggles a reminder done and back to undone", async ({ page }) => {
  await page.goto("/reminders");

  // Scope to the Card (not just any ancestor <div>, which would match
  // the innermost text wrapper that doesn't contain the button).
  const row = page.locator("div.rounded-2xl", { hasText: "Racheter de l'essuie-tout" });
  const toggleButton = row.getByRole("button", { name: "Terminé" });
  await toggleButton.click();

  await expect(page.getByRole("button", { name: "Annuler" }).first()).toBeVisible();

  await page.getByRole("button", { name: "Annuler" }).first().click();
  await expect(page.getByRole("button", { name: "Terminé" }).first()).toBeVisible();
});
