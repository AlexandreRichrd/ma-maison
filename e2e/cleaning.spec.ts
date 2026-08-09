import { expect, test } from "@playwright/test";

import { login } from "./utils";

test.beforeEach(async ({ page }) => {
  await login(page);
});

test("completes a chore for the week", async ({ page }) => {
  await page.goto("/cleaning");
  await expect(page).toHaveURL(/\?week=\d{4}-W\d{2}/);

  const kitchenRow = page.locator("form", { hasText: "Kitchen" }).first();
  const checkbox = kitchenRow.getByRole("checkbox");
  await expect(checkbox).not.toBeChecked();

  // Controlled checkbox — .click() rather than .check(), see shopping.spec.ts.
  await checkbox.click();
  await expect(checkbox).toBeChecked();
});

test("navigates between weeks via the URL", async ({ page }) => {
  await page.goto("/cleaning");
  const initialWeek = new URL(page.url()).searchParams.get("week");

  await page.getByRole("link", { name: "Next week" }).click();
  await page.waitForURL((url) => url.searchParams.get("week") !== initialWeek);
  const nextWeek = new URL(page.url()).searchParams.get("week");
  expect(nextWeek).not.toBe(initialWeek);

  await page.getByRole("link", { name: "Previous week" }).click();
  await expect(page).toHaveURL(`/cleaning?week=${initialWeek}`);
});
