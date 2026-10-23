// Главная только запускает, выбор — на экране «Настройка тренировки»: сводка, темы списком, шторка подтем одной темы.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileInput, openSettings } from "./fixtures.mjs";
import { DIST_DIR } from "./lib.mjs";

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default async function training(t) {
  const { check, visible } = t;
  const data = JSON.parse(readFileSync(join(DIST_DIR, "questions.json"), "utf8"));
  const topic = (id) => data.topics.find((x) => x.id === id);

  const context = await t.newContext({ serviceWorkers: "block" });
  const page = await context.newPage();
  const summary = page.getByRole("button", { name: /^Тренировка/ });
  const summaryText = async () => (await summary.innerText()).replace(/\s+/g, " ");
  const row = (title) => page.getByRole("button", { name: new RegExp(`^${escapeRegExp(title)} \\d+ вопрос`) });
  const pill = (title) => page.getByRole("button", { name: new RegExp(`^Подтемы «${escapeRegExp(title)}»`) });
  const dialog = page.getByRole("dialog");
  const back = () => page.getByRole("button", { name: "Назад" }).click();

  await page.goto(t.url);
  await page.getByRole("heading", { name: "Тренажёр" }).waitFor();
  check("сводка по умолчанию — все темы, подтемы и уровни", (await summaryText()).includes("Все темы все подтемы · все уровни"), await summaryText());
  check(
    "на главной нет выбора тем и уровней",
    !(await visible(page.getByRole("group", { name: "Уровень" }), 500)) && !(await visible(page.getByText("Темы", { exact: true }), 500)),
  );
  check("на главной — «Все / Новые / Ошибки» и «Начать»", await visible(page.getByRole("group", { name: "Какие вопросы" })));
  await t.shot(page, "home");

  // Экран настройки: темы списком.
  await openSettings(page);
  check("подзаголовок — тестовые вопросы", await visible(page.getByText("Тестовые вопросы", { exact: true })));
  const rows = page.locator("button[aria-pressed]").filter({ hasText: /вопрос/ });
  check(`темы списком — ${data.topics.length} строк`, (await rows.count()) === data.topics.length, `${await rows.count()}`);
  await t.shot(page, "settings");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(200);
  await t.shot(page, "settings-bottom");

  await page.getByRole("button", { name: "Снять все", exact: true }).click();
  check(
    "«Снять все» — ничего не подходит, «Начать» недоступна",
    (await visible(page.getByText("Под фильтр ничего не подходит — включи темы или уровни"))) &&
      (await page.getByRole("button", { name: /^Начать/ }).isDisabled()),
  );
  for (const id of ["javascript", "typescript", "react"]) await row(topic(id).title).click();
  check("галка темы нажата", (await row("React").getAttribute("aria-pressed")) === "true");
  await back();
  check("сводка называет выбранные темы", (await summaryText()).includes("JavaScript, TypeScript, React все подтемы"), await summaryText());

  await openSettings(page);
  for (const id of ["network", "nextjs"]) await row(topic(id).title).click();
  await back();
  check("больше трёх тем — «и ещё 2»", (await summaryText()).includes("JavaScript, TypeScript, React и ещё 2"), await summaryText());

  // Шторка подтем одной темы.
  await openSettings(page);
  const js = topic("javascript");
  const jsCount = js.subtopics.length;
  await pill(js.title).click();
  check(
    "шторка одной темы: заголовок и «Выбрано N из N»",
    (await visible(dialog.getByRole("heading", { name: "JavaScript" }))) && (await visible(dialog.getByText(`${jsCount} из ${jsCount}`))),
  );
  // Шторка выезжает 0,22 с — снимаем, когда доехала.
  await page.waitForTimeout(400);
  await t.shot(page, "sheet");
  await dialog.getByRole("button", { name: /^Замыкания/ }).click();
  check("снятая подтема — «Выбрано N−1 из N»", await visible(dialog.getByText(`${jsCount - 1} из ${jsCount}`)));
  await dialog.getByRole("button", { name: "Готово" }).click();
  check("пилюля темы — «N−1 из N»", await visible(page.getByRole("button", { name: `Подтемы «JavaScript»: ${jsCount - 1} из ${jsCount}` })));
  await t.shot(page, "settings-partial");

  const react = topic("react");
  await pill(react.title).click();
  await dialog.getByRole("button", { name: "Снять все" }).click();
  check("сняты все подтемы — тема выключилась", (await row("React").getAttribute("aria-pressed")) === "false");
  await dialog.getByRole("button", { name: /^Версии React/ }).click();
  check(
    "подтема у выключенной темы включает тему, только с ней",
    (await row("React").getAttribute("aria-pressed")) === "true" && (await visible(dialog.getByText(`1 из ${react.subtopics.length}`))),
  );
  await page.keyboard.press("Escape");
  await back();
  const selectedSubtopics = ["javascript", "typescript", "network", "nextjs"].reduce((sum, id) => sum + topic(id).subtopics.length, 0);
  const subtopicsTotal = selectedSubtopics + react.subtopics.length;
  // В JavaScript снята одна подтема, в React включена только одна.
  const subtopicsOn = selectedSubtopics - 1 + 1;
  check("сводка считает подтемы", (await summaryText()).includes(`подтемы ${subtopicsOn} из ${subtopicsTotal}`), await summaryText());

  // «Какие вопросы» и уровни — общие с главной.
  await openSettings(page);
  await page.getByRole("group", { name: "Какие вопросы" }).getByRole("button", { name: /^Новые/ }).click();
  await page.getByRole("button", { name: "Senior", exact: true }).click();
  await back();
  check(
    "«Новые», выбранные на экране настройки, выбраны и на главной",
    (await page.getByRole("group", { name: "Какие вопросы" }).getByRole("button", { name: /^Новые/ }).getAttribute("aria-pressed")) === "true",
  );
  check("уровни в сводке", (await summaryText()).endsWith("Junior, Middle"), await summaryText());
  await t.shot(page, "home-partial");

  // Старт прямо с экрана настройки: из итога «Назад» ведёт на главную, а не обратно в настройку.
  await openSettings(page);
  await page.getByRole("button", { name: "10", exact: true }).click();
  await page.getByRole("button", { name: "Начать · 10 вопросов" }).click();
  await page.getByText("1 / 10").waitFor();
  await page.getByRole("button", { name: "Не знаю" }).click();
  await page.goBack();
  await page.getByText(/^Сессия завершена/).waitFor();
  await page.getByRole("button", { name: "На главную" }).click();
  check("старт с экрана настройки: из итога — на главную", await visible(page.getByRole("heading", { name: "Тренажёр" })));

  // Устные вопросы: тот же экран, своя подпись, без галки «Добавлять устные».
  await page.getByRole("button", { name: /Устные вопросы/ }).click();
  check("экран устных — сводка и «Начать»", (await visible(summary)) && (await visible(page.getByRole("button", { name: /^Начать/ }))));
  await t.shot(page, "speech-home");
  await openSettings(page);
  check(
    "настройка устных: своя подпись, без галки",
    (await visible(page.getByText("Устные вопросы", { exact: true }))) && !(await visible(page.getByText("Добавлять устные вопросы"), 500)),
  );
  await back();
  await back();

  // Маленький свой набор без тем и подтем: на экране настройки нет карточки тем.
  await page.getByRole("button", { name: /Свои наборы/ }).click();
  const small = `title: Маленький
questions:
  - id: m-1
    level: junior
    question: Единственный
    options:
      - text: да
        correct: true
      - text: нет
`;
  await page.locator('input[type="file"]').setInputFiles(fileInput("small.yaml", small));
  await page.getByRole("button", { name: /^Маленький/ }).click();
  check("набор без тем: в сводке — «Все вопросы»", (await summaryText()).includes("Все вопросы все уровни"), await summaryText());
  await t.shot(page, "set-home");
  await openSettings(page);
  check(
    "набор без тем: карточки «Темы» нет, уровни есть",
    !(await visible(page.getByText("Темы", { exact: true }), 500)) && (await visible(page.getByRole("group", { name: "Уровень" }))),
  );
  check("подзаголовок — имя набора", await visible(page.getByText("Набор «Маленький»")));
  await t.shot(page, "set-settings");
  await context.close();

  // Узкие экраны: 360 — целевой, 330 — «просто работает».
  for (const width of [360, 330]) {
    const narrow = await t.newContext({ serviceWorkers: "block", viewport: { width, height: 760 } });
    const p = await narrow.newPage();
    await p.goto(t.url);
    await p.getByRole("heading", { name: "Тренажёр" }).waitFor();
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(`${width}px: главная без горизонтальной прокрутки`, overflow <= 0, `${overflow}px`);
    await t.shot(p, `home-${width}`);
    await openSettings(p);
    const settingsOverflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(`${width}px: экран настройки без горизонтальной прокрутки`, settingsOverflow <= 0, `${settingsOverflow}px`);
    await t.shot(p, `settings-${width}`);
    await p.getByRole("button", { name: /^Подтемы «React»/ }).click();
    await p.waitForTimeout(400);
    await t.shot(p, `sheet-${width}`);
    await narrow.close();
  }
}
