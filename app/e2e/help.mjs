// Помощь: подсказка «Впервые здесь?» в «Курсах», экран «Помощь» с двумя инструкциями, разделы, «Поделиться», переходы,
// прямые ссылки #help, #help-basics и #help-sets.
export default async function help(t) {
  const { check, visible } = t;
  const context = await t.newContext({ section: "courses" });
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: t.url.slice(0, -1) });
  const page = await context.newPage();
  const hub = page.getByRole("heading", { name: "Помощь" });
  const basics = page.getByRole("heading", { name: "Как пользоваться" });
  const setsHelp = page.getByRole("heading", { name: "Свои наборы вопросов" });
  const share = async (expectedHash) => {
    await page.getByRole("button", { name: "Поделиться ссылкой на инструкцию" }).click();
    check(`«Поделиться» копирует ссылку ${expectedHash}`, await visible(page.getByRole("button", { name: "Ссылка скопирована" })));
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    check(`в буфере ссылка на ${expectedHash}`, copied === `${t.url}${expectedHash}`, copied);
  };

  await page.goto(t.url);
  await page.getByRole("heading", { name: "Курсы", exact: true }).waitFor();
  check("плашка «Впервые здесь?» на первом открытии", await visible(page.getByText("Впервые здесь?")));
  await page.waitForTimeout(300);
  await t.shot(page, "hint");

  await page.getByRole("button", { name: "Как устроена Зубрилка" }).click();
  check("плашка ведёт на экран «Помощь»", await visible(hub));
  check(
    "на «Помощи» — обе инструкции плитками",
    (await visible(page.getByRole("button", { name: /^Как пользоваться/ }))) &&
      (await visible(page.getByRole("button", { name: /^Свои наборы вопросов/ }))),
  );
  await t.shot(page, "hub", true);
  await share("#help");

  await page.getByRole("button", { name: /^Как пользоваться/ }).click();
  check("плитка открывает общую инструкцию", await visible(basics));
  check("первый раздел раскрыт", await visible(page.getByText(/курсы и тренажёр для подготовки/)));
  check("остальные разделы свёрнуты", !(await page.getByText("Открой сайт в Chrome.").isVisible()));
  await page.getByText("Как установить на телефон или ноутбук").click();
  check("раздел раскрывается по нажатию", await visible(page.getByText("Открой сайт в Chrome.")));
  await page.getByText("Вопросы с несколькими ответами").click();
  await t.shot(page, "general", true);
  await share("#help-basics");

  await page.getByText("Свои наборы вопросов", { exact: true }).click();
  await page.getByRole("button", { name: "Инструкция про свои наборы" }).click();
  check("кнопка в общей инструкции ведёт к инструкции про наборы", await visible(setsHelp));
  await page.getByText("Формат файла: все возможности").click();
  await page.getByText("Подводные камни YAML").click();
  check("пример YAML подсвечен", (await page.locator("pre .token").count()) > 10);
  await page.getByText("Попробовать на готовом примере").click();
  const example = page.locator("details", { hasText: "Попробовать на готовом примере" });
  check("после входа «Свои наборы» в инструкции — кнопка", await visible(example.getByRole("button", { name: "«Свои наборы»" })));
  await t.shot(page, "sets", true);
  await share("#help-sets");

  await page.getByRole("button", { name: "Назад" }).click();
  check("«Назад» — снова общая инструкция", await visible(basics));
  await page.getByRole("button", { name: "Назад" }).click();
  check("«Назад» — снова «Помощь»", await visible(hub));
  await page.getByRole("button", { name: "Назад" }).click();
  check("«Назад» — на главную", await visible(page.getByRole("heading", { name: "Курсы", exact: true })));
  check("плашка больше не показывается", !(await page.getByText("Впервые здесь?").isVisible()));
  await page.reload();
  await page.getByRole("heading", { name: "Курсы", exact: true }).waitFor();
  check("и после перезагрузки тоже", !(await visible(page.getByText("Впервые здесь?"), 800)));

  await page.getByRole("button", { name: "Помощь" }).click();
  check("кнопка «?» в шапке открывает «Помощь»", await visible(hub));
  await page.getByRole("button", { name: /^Свои наборы вопросов/ }).click();
  check("плитка «Свои наборы вопросов» открывает инструкцию про наборы", await visible(setsHelp));
  await page.getByRole("button", { name: "Назад" }).click();
  await page.getByRole("button", { name: "Назад" }).click();

  await page.getByRole("button", { name: "Тренажёр" }).click();
  await page.getByRole("button", { name: /Свои наборы/ }).click();
  await page.getByRole("button", { name: "инструкция", exact: true }).click();
  check("с экрана наборов — сразу инструкция про наборы", await visible(setsHelp));
  await context.close();

  for (const [hash, heading] of [
    ["#help", "Помощь"],
    ["#help-basics", "Как пользоваться"],
    ["#help-sets", "Свои наборы вопросов"],
  ]) {
    const direct = await t.newContext();
    const p = await direct.newPage();
    await p.goto(t.url + hash);
    check(`прямая ссылка ${hash} открывает «${heading}»`, await visible(p.getByRole("heading", { name: heading }), 5000));
    check(`${hash}: метка убрана из адреса`, !p.url().includes("#"), p.url());
    await p.goBack();
    check(`${hash}: «Назад» ведёт на главную`, await visible(p.getByRole("heading", { name: "Тренажёр" })));
    await direct.close();
  }
}
