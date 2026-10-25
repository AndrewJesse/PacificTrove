import { expect, test } from "@playwright/test";

test.describe("Model pair", () => {
  test("shows a model menu on each side of the composer", async ({ page }) => {
    await page.goto("/");
    const answer = page.getByTestId("model-selector");
    const adversary = page.getByTestId("model-selector-adversary");
    await expect(answer).toBeVisible();
    await expect(adversary).toBeVisible();
    await expect(answer).toContainText("Claude");
    await expect(adversary).toContainText("Trove");
  });
});
