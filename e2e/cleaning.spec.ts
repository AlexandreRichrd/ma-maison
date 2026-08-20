import { expect, test } from "@playwright/test";

test("completes a daily chore", async ({ page }) => {
  await page.goto("/cleaning");
  await expect(page).toHaveURL(/\?date=\d{4}-\d{2}-\d{2}/);

  const dishesRow = page.locator("form", { hasText: "Vaisselle" }).first();
  const checkbox = dishesRow.getByRole("checkbox");
  await expect(checkbox).not.toBeChecked();

  // Controlled checkbox — .click() rather than .check(), see shopping.spec.ts.
  await checkbox.click();
  await expect(checkbox).toBeChecked();
});

test("navigates between days via the URL", async ({ page }) => {
  await page.goto("/cleaning");
  const initialDate = new URL(page.url()).searchParams.get("date");

  await page.getByRole("link", { name: "Jour suivant" }).click();
  await page.waitForURL((url) => url.searchParams.get("date") !== initialDate);
  const nextDate = new URL(page.url()).searchParams.get("date");
  expect(nextDate).not.toBe(initialDate);

  await page.getByRole("link", { name: "Jour précédent" }).click();
  await expect(page).toHaveURL(`/cleaning?date=${initialDate}`);
});

test("shows the persistent weekly block above the day view", async ({ page }) => {
  await page.goto("/cleaning?date=2024-01-01");

  await expect(page.getByRole("heading", { name: "Cette semaine" })).toBeVisible();
  // Cuisine is weekly, anchored 2024-01-01 — occurs every week.
  await expect(page.locator("form", { hasText: "Cuisine" }).first()).toBeVisible();
});

test("a biweekly chore is present on its on-week and absent on its off-week", async ({ page }) => {
  // Draps is anchored 2024-01-01 (WEEK/2) — occurs 2024-01-01, not
  // 2024-01-08, occurs again 2024-01-15.
  await page.goto("/cleaning?date=2024-01-01");
  await expect(page.locator("form", { hasText: "Draps" }).first()).toBeVisible();

  await page.goto("/cleaning?date=2024-01-08");
  await expect(page.locator("form", { hasText: "Draps" })).toHaveCount(0);
});

test("renders an explicit empty state for a day before every chore's anchor", async ({ page }) => {
  // Every seeded chore is anchored on-or-after 2024-01-01 — the day
  // before that has nothing scheduled for either person, and must say so
  // rather than rendering blank columns.
  await page.goto("/cleaning?date=2023-12-31");

  await expect(page.getByText("Aucune corvée ce jour-là.")).toHaveCount(2);
});

test("the next-day button never moves, across a week boundary and a single-to-double-digit day", async ({
  page,
}) => {
  // 2024-01-01 is a Monday (single-digit day, start of 2024-W01).
  // Clicking forward 10 times lands on 2024-01-11 (double-digit day),
  // crossing the 2024-01-08 week boundary along the way.
  await page.goto("/cleaning?date=2024-01-01");

  const nextButton = page.getByRole("link", { name: "Jour suivant" });
  const referenceBox = await nextButton.boundingBox();
  expect(referenceBox).not.toBeNull();

  let previousDate = "2024-01-01";
  for (let i = 0; i < 10; i++) {
    await nextButton.click();
    await page.waitForURL((url) => url.searchParams.get("date") !== previousDate);
    previousDate = new URL(page.url()).searchParams.get("date") ?? "";

    const box = await nextButton.boundingBox();
    expect(box).toEqual(referenceBox);
  }

  expect(previousDate).toBe("2024-01-11");
});

test("expanding a chore with subtasks ticks/unticks the parent as subtasks change", async ({
  page,
}) => {
  await page.goto("/cleaning?date=2024-01-01");

  const dishesRow = page.locator("form", { hasText: "Vaisselle" }).first();
  const parentCheckbox = dishesRow.getByRole("checkbox");

  await page.getByRole("button", { name: "Afficher les sous-tâches" }).click();
  const wash = page.locator("label", { hasText: "Laver" }).getByRole("checkbox");
  const putAway = page.locator("label", { hasText: "Ranger" }).getByRole("checkbox");

  await expect(parentCheckbox).not.toBeChecked();

  await wash.click();
  await expect(wash).toBeChecked();
  await expect(parentCheckbox).not.toBeChecked();

  await putAway.click();
  await expect(putAway).toBeChecked();
  await expect(parentCheckbox).toBeChecked();

  // Unticking any one subtask unticks the parent.
  await wash.click();
  await expect(wash).not.toBeChecked();
  await expect(parentCheckbox).not.toBeChecked();
});
