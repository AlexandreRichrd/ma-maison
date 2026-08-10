import type { Page } from "@playwright/test";

/** Matches app/db/seed.ts's fixture users. */
export const DEV_EMAIL = "mia@example.com";
export const DEV_PASSWORD = "devpassword";

export async function login(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(DEV_EMAIL);
  await page.getByLabel("Mot de passe").fill(DEV_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL("/");
}
