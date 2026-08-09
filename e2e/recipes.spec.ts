import { expect, test } from "@playwright/test";

import { login } from "./utils";

test.beforeEach(async ({ page }) => {
  await login(page);
});

test("adds a recipe's ingredients to an existing list", async ({ page }) => {
  await page.goto("/recipes");
  await page.getByRole("link", { name: /Spaghetti Bolognese/ }).click();
  await expect(page.getByRole("heading", { name: "Spaghetti Bolognese" })).toBeVisible();

  await page.getByRole("button", { name: "Weekly Groceries" }).click();

  await expect(page.getByRole("status")).toContainText("Weekly Groceries");
});

test("creates a new list from a recipe and redirects to it", async ({ page }) => {
  await page.goto("/recipes");
  await page.getByRole("link", { name: /Veggie Stir Fry/ }).click();
  await expect(page.getByRole("heading", { name: "Veggie Stir Fry" })).toBeVisible();

  await page.getByRole("button", { name: "+ New list" }).click();

  await expect(page).toHaveURL(/\/shopping\/.+/);
  await expect(page.getByRole("heading", { name: "Veggie Stir Fry" })).toBeVisible();
  await expect(page.getByText("Broccoli")).toBeVisible();
});
