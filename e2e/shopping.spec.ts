import { expect, test } from "@playwright/test";

import { login } from "./utils";

test.beforeEach(async ({ page }) => {
  await login(page);
});

test("checking a shopping item toggles it without navigating", async ({ page }) => {
  await page.goto("/shopping");
  await page.getByRole("link", { name: "Weekly Groceries" }).click();
  await expect(page).toHaveURL(/\/shopping\/.+/);
  const listUrl = page.url();

  const milkRow = page.locator("form", { hasText: "Milk" });
  const checkbox = milkRow.getByRole("checkbox");
  await expect(checkbox).not.toBeChecked();

  await checkbox.check();

  await expect(checkbox).toBeChecked();
  await expect(milkRow.getByText("Milk")).toHaveClass(/line-through/);
  expect(page.url()).toBe(listUrl);
});
