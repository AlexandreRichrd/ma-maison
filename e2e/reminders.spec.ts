import { expect, test } from "@playwright/test";

import { login } from "./utils";

test.beforeEach(async ({ page }) => {
  await login(page);
});

test("toggles a reminder done and back to undone", async ({ page }) => {
  await page.goto("/reminders");

  const row = page.locator("div", { hasText: "Restock paper towels" }).last();
  const toggleButton = row.getByRole("button", { name: "Done" });
  await toggleButton.click();

  await expect(page.getByRole("button", { name: "Undo" }).first()).toBeVisible();

  await page.getByRole("button", { name: "Undo" }).first().click();
  await expect(page.getByRole("button", { name: "Done" }).first()).toBeVisible();
});
