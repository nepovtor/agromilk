import { expect, test } from "@playwright/test";

test("public application can be submitted once", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("Ваше имя").fill("E2E Farmer");
  await page.getByPlaceholder("Ваш телефон").fill("+375291112233");
  await page.getByRole("button", { name: "Заказать" }).dblclick();
  await expect(
    page.getByText("Заявка принята. Мы свяжемся с вами в ближайшее рабочее время."),
  ).toBeVisible();
});
