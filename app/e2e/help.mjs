// Инструкция: плашка «Впервые здесь?», разделы, «Поделиться», переходы, прямые ссылки #help и #help-sets.
export default async function help(t) {
  const { check, visible } = t;
  const context = await t.newContext();
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: t.url.slice(0, -1) });
  const page = await context.newPage();
  await page.goto(t.url);
  await page.getByText("Что тренируем?").waitFor();
  check("плашка «Впервые здесь?» на первом открытии", await visible(page.getByText("Впервые здесь?")));
  await page.waitForTimeout(300);
  await t.shot(page, "hint");

  await page.getByRole("button", { name: "Открыть инструкцию" }).click();
  check("инструкция открылась", await visible(page.getByRole("heading", { name: "Как пользоваться" })));
  check("первый раздел раскрыт", await visible(page.getByText(/тренажёр вопросов с вариантами ответов/)));
  check("остальные разделы свёрнуты", !(await page.getByText("Открой сайт в Chrome.").isVisible()));
  await page.getByText("Как установить на телефон или ноутбук").click();
  check("раздел раскрывается по нажатию", await visible(page.getByText("Открой сайт в Chrome.")));
  await page.getByText("Вопросы с несколькими ответами").click();
  await t.shot(page, "general", true);

  await page.getByRole("button", { name: "Поделиться ссылкой на инструкцию" }).click();
  check("«Поделиться» копирует ссылку", await visible(page.getByRole("button", { name: "Ссылка скопирована" })));
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  check("в буфере ссылка на #help", copied === `${t.url}#help`, copied);

  await page.getByText("Свои наборы вопросов", { exact: true }).click();
  await page.getByRole("button", { name: "отдельная инструкция про свои наборы" }).click();
  check("переход к инструкции про наборы", await visible(page.getByRole("heading", { name: "Свои наборы вопросов" })));
  await page.getByText("Формат файла: все возможности").click();
  await page.getByText("Подводные камни YAML").click();
  check("пример YAML подсвечен", (await page.locator("pre .token").count()) > 10);
  await page.getByText("Попробовать на готовом примере").click();
  const example = page.locator("details", { hasText: "Попробовать на готовом примере" });
  check("после входа «Мои наборы» в инструкции — кнопка", await visible(example.getByRole("button", { name: "«Мои наборы»" })));
  await t.shot(page, "sets", true);

  await page.getByRole("button", { name: "Назад" }).click();
  check("«Назад» — снова общая инструкция", await visible(page.getByRole("heading", { name: "Как пользоваться" })));
  await page.getByRole("button", { name: "Назад" }).click();
  check("«Назад» — на главную", await visible(page.getByText("Что тренируем?")));
  check("плашка больше не показывается", !(await page.getByText("Впервые здесь?").isVisible()));
  await page.reload();
  await page.getByText("Что тренируем?").waitFor();
  check("и после перезагрузки тоже", !(await visible(page.getByText("Впервые здесь?"), 800)));

  await page.getByRole("button", { name: "Как пользоваться" }).click();
  check("кнопка «?» в шапке открывает инструкцию", await visible(page.getByRole("heading", { name: "Как пользоваться" })));
  await page.getByRole("button", { name: "Назад" }).click();

  await page.getByRole("button", { name: /Мои наборы/ }).click();
  await page.getByRole("button", { name: "инструкция", exact: true }).click();
  check("с экрана наборов — инструкция про наборы", await visible(page.getByRole("heading", { name: "Свои наборы вопросов" })));
  await context.close();

  for (const [hash, heading] of [
    ["#help", "Как пользоваться"],
    ["#help-sets", "Свои наборы вопросов"],
  ]) {
    const direct = await t.newContext();
    const p = await direct.newPage();
    await p.goto(t.url + hash);
    check(`прямая ссылка ${hash} открывает раздел`, await visible(p.getByRole("heading", { name: heading }), 5000));
    check(`${hash}: метка убрана из адреса`, !p.url().includes("#"), p.url());
    await p.goBack();
    check(`${hash}: «Назад» ведёт на главную`, await visible(p.getByText("Что тренируем?")));
    await direct.close();
  }
}
