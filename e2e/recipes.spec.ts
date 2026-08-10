import { expect, test } from "@playwright/test";

test("adds a recipe's ingredients to an existing list", async ({ page }) => {
  await page.goto("/recipes");
  await page.getByRole("link", { name: /Spaghetti à la bolognaise/ }).click();
  await expect(page.getByRole("heading", { name: "Spaghetti à la bolognaise" })).toBeVisible();

  await page.getByRole("button", { name: "Courses de la semaine" }).click();

  await expect(page.getByRole("status")).toContainText("Courses de la semaine");
});

test("creates a new list from a recipe and redirects to it", async ({ page }) => {
  await page.goto("/recipes");
  await page.getByRole("link", { name: /Poêlée de légumes/ }).click();
  await expect(page.getByRole("heading", { name: "Poêlée de légumes" })).toBeVisible();

  await page.getByRole("button", { name: "+ Nouvelle liste" }).click();

  await expect(page).toHaveURL(/\/shopping\/.+/);
  await expect(page.getByRole("heading", { name: "Poêlée de légumes" })).toBeVisible();
  await expect(page.getByText("Brocoli")).toBeVisible();
});
