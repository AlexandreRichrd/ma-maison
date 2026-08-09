import type { Page } from "@playwright/test";

/** Matches the AUTH_PASSWORD_HASH generated for local dev in .env — see .env.example. */
export const DEV_PASSWORD = "devpassword";

export async function login(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Mot de passe du foyer").fill(DEV_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL("/");
}
