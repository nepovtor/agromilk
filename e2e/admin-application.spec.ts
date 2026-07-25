import { expect, test } from "@playwright/test";

const unique = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

test("administrator finds, updates and protects an application", async ({ page }) => {
  const marker = `E2E application ${unique()}`;
  const create = await page.request.post("/api/v1/applications", {
    data: {
      submissionId: crypto.randomUUID(),
      name: marker,
      phone: "+375291112233",
      email: "e2e@example.com",
      consent: true,
      sourcePage: "/",
    },
  });
  expect(create.status()).toBe(201);

  await page.goto("/admin/applications");
  await expect(page.getByText("Вход в агро-пульт")).toBeVisible();
  await page.getByLabel("Email").fill("admin@example.com");
  await page.getByLabel("Пароль").fill("TestPassword123!");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.getByRole("link", { name: "Заявки" }).click();
  await page.getByPlaceholder("Хозяйство, телефон или email").fill(marker);
  await page.getByRole("button", { name: "Найти" }).click();
  await expect(page.getByText(marker)).toBeVisible();
  await page
    .getByRole("row", { name: new RegExp(marker) })
    .getByLabel("Открыть заявку")
    .click();
  const panel = page.getByRole("dialog");
  await expect(panel.getByText(marker)).toBeVisible();
  await panel.getByLabel("Статус").selectOption("in_progress");
  const save = page.waitForResponse(
    (response) =>
      response.url().includes("/api/v1/admin/applications/") &&
      response.request().method() === "PATCH",
  );
  await panel.getByRole("button", { name: "Сохранить" }).click();
  expect((await save).ok()).toBeTruthy();
  await page.reload();
  await expect(
    page.getByRole("row", { name: new RegExp(marker) }).getByText("В работе"),
  ).toBeVisible();

  await page.getByRole("button", { name: "Выйти" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto("/admin/applications");
  await expect(page.getByText("Вход в агро-пульт")).toBeVisible();
});
