import { expect, test } from "@playwright/test";

import { login } from "./utils";

test.beforeEach(async ({ page }) => {
  await login(page);
});

test("toggles a reminder done and back to undone", async ({ page }) => {
  await page.goto("/reminders");

  // Scope to the Card (not just any ancestor <div>, which would match
  // the innermost text wrapper that doesn't contain the button).
  const row = page.locator("div.rounded-2xl", { hasText: "Restock paper towels" });
  const toggleButton = row.getByRole("button", { name: "Done" });
  await toggleButton.click();

  await expect(page.getByRole("button", { name: "Undo" }).first()).toBeVisible();

  await page.getByRole("button", { name: "Undo" }).first().click();
  await expect(page.getByRole("button", { name: "Done" }).first()).toBeVisible();
});
