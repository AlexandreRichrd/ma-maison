import { expect, test } from "@playwright/test";

test("completes a daily chore", async ({ page }) => {
  await page.goto("/cleaning");
  await expect(page).toHaveURL(/\?date=\d{4}-\d{2}-\d{2}/);

  const checkbox = page.getByRole("checkbox", { name: "Vaisselle" });
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
  await expect(page.getByRole("checkbox", { name: "Cuisine" })).toBeVisible();
});

test("a biweekly chore is present on its on-week and absent on its off-week", async ({ page }) => {
  // Draps is anchored 2024-01-01 (WEEK/2) — occurs 2024-01-01, not
  // 2024-01-08, occurs again 2024-01-15.
  await page.goto("/cleaning?date=2024-01-01");
  await expect(page.getByRole("checkbox", { name: "Draps" })).toBeVisible();

  await page.goto("/cleaning?date=2024-01-08");
  await expect(page.getByRole("checkbox", { name: "Draps" })).toHaveCount(0);
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

test("day view: subtasks render inline with no expand interaction, and only their own checkbox completes them", async ({
  page,
}) => {
  await page.goto("/cleaning?date=2024-01-01");

  // Vaisselle is the seeded daily chore with subtasks — no accordion in
  // the day view, so there's no expand button for it at all.
  await expect(page.getByRole("button", { name: /Vaisselle/ })).toHaveCount(0);

  const parentCheckbox = page.getByRole("checkbox", { name: "Vaisselle" });
  const wash = page.getByRole("checkbox", { name: "Laver" });
  const putAway = page.getByRole("checkbox", { name: "Ranger" });

  // Visible without any interaction.
  await expect(wash).toBeVisible();
  await expect(putAway).toBeVisible();
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

  // Tapping the subtask's label text, not its checkbox, completes nothing.
  await page.getByText("Laver", { exact: true }).click();
  await expect(wash).not.toBeChecked();
});

test("weekly block: tapping the checkbox never expands the row, tapping the row expands it, and the checkbox hit area is >= 44x44", async ({
  page,
}) => {
  await page.goto("/cleaning?date=2024-01-01");

  // Cuisine is the seeded weekly chore with subtasks.
  const trigger = page.getByRole("button", { name: "Cuisine" });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");

  const checkbox = page.getByRole("checkbox", { name: "Cuisine" });
  const hitArea = checkbox.locator("xpath=..");
  const box = await hitArea.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);

  // Ticking the checkbox does not expand the row. (Ticking the parent
  // cascades to every subtask — see the day-view test — so untick it
  // again right after to leave subtask state clean for what follows.)
  await checkbox.click();
  await expect(checkbox).toBeChecked();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("checkbox", { name: "Plan de travail" })).not.toBeVisible();
  await checkbox.click();
  await expect(checkbox).not.toBeChecked();

  // Tapping the row (not the checkbox) expands it.
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  const worktop = page.getByRole("checkbox", { name: "Plan de travail" });
  await expect(worktop).toBeVisible();

  // The subtask checkbox alone completes it — the row toggle above only expands.
  await expect(worktop).not.toBeChecked();
  await worktop.click();
  await expect(worktop).toBeChecked();
});
