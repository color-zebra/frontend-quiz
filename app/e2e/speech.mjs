// Устные вопросы: устный набор из файла, эталон и самооценка, раздел в основной базе, галка «Добавлять устные».
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileInput, openSettings, option, question, speechQuestion, withBank } from "./fixtures.mjs";
import { ROOT_DIR } from "./lib.mjs";

export default async function speech(t) {
  const { check, visible } = t;

  // Устный набор из файла-примера.
  {
    const context = await t.newContext({ serviceWorkers: "block" });
    const page = await context.newPage();
    await page.goto(t.url);
    await page.getByRole("heading", { name: "Тренажёр" }).waitFor();
    await page.getByRole("button", { name: /Свои наборы/ }).click();
    const sample = readFileSync(join(ROOT_DIR, "examples", "speech-sample.yaml"), "utf8");
    await page.locator('input[type="file"]').setInputFiles(fileInput("speech-sample.yaml", sample));
    check("устный набор добавлен: 6 вопросов", await visible(page.getByText("Добавлен «Пример устного набора — JavaScript и React»: 6 вопросов.")));
    check("в списке пометка «устные»", await visible(page.getByText(/устные · 6 вопросов/)));

    await page.getByRole("button", { name: /^Пример устного набора/ }).click();
    check("экран набора: раздел «Устные вопросы»", await visible(page.getByText(/^Устные вопросы · 6 вопросов/)));
    await openSettings(page);
    check("у устного набора нет галки «Добавлять устные»", !(await visible(page.getByText("Добавлять устные вопросы"), 500)));
    await page.getByRole("button", { name: "10", exact: true }).click();
    await page.getByRole("button", { name: "Назад" }).click();
    await page.getByRole("button", { name: "Начать · 6 вопросов" }).click();

    await page.getByText("1 / 6").waitFor();
    check("устный вопрос: подсказка вместо вариантов", await visible(page.getByText("Ответь про себя или вслух, потом открой эталон")));
    check("устный вопрос: вариантов нет", (await page.locator("ol li button").count()) === 0);
    check("нет кнопки «Не знаю» у устного", !(await page.getByRole("button", { name: "Не знаю" }).isVisible()));
    await page.getByRole("button", { name: "Показать ответ" }).click();
    check("эталонный ответ показан", await visible(page.getByRole("heading", { name: "Эталонный ответ" })));
    check("тезисы показаны", await visible(page.getByText("Что стоит упомянуть")));
    await t.shot(page, "reveal", true);
    await page.getByRole("button", { name: "Знал", exact: true }).click();

    await page.getByText("2 / 6").waitFor();
    check("после оценки сразу следующий вопрос", true);
    await page.keyboard.press("Enter");
    check("Enter показывает эталон", await visible(page.getByRole("heading", { name: "Эталонный ответ" })));
    await page.keyboard.press("1");
    for (let i = 3; i <= 6; i++) {
      await page.getByText(`${i} / 6`).waitFor();
      await page.getByRole("button", { name: "Показать ответ" }).click();
      await page.getByRole("button", { name: i % 2 ? "Частично" : "Знал", exact: true }).click();
    }
    check("итог устной сессии с разбивкой", await visible(page.getByText("Отвечено 6 вопросов · устно: знал 3, частично 2, не знал 1")));
    check("кнопка «Повторить слабые»", await visible(page.getByRole("button", { name: "Повторить слабые · 3" })));
    check("кольцо считает «знал»", await visible(page.getByText(/^50% знал$/)));
    await t.shot(page, "summary", true);
    await context.close();
  }

  // Тестовый набор с устным вопросом внутри — устный пропускается с объяснением.
  {
    const context = await t.newContext({ serviceWorkers: "block" });
    const page = await context.newPage();
    await page.goto(t.url);
    await page.getByRole("heading", { name: "Тренажёр" }).waitFor();
    await page.getByRole("button", { name: /Свои наборы/ }).click();
    const mixed = `title: Смешанный
questions:
  - id: t-1
    level: junior
    question: Тестовый
    options:
      - text: да
        correct: true
      - text: нет
  - id: s-1
    level: junior
    question: Устный
    answer: Эталон
`;
    await page.locator('input[type="file"]').setInputFiles(fileInput("mixed.yaml", mixed));
    await page.getByText("Что пропущено").click();
    check("устный вопрос в тестовом наборе пропущен с причиной", await visible(page.getByText(/^s-1: это устный вопрос/)));
    await context.close();
  }

  // Раздел устных вопросов в основной базе и галка «Добавлять устные вопросы».
  const questions = [
    question("q-1", "Тестовый 1", [option("A", true), option("B"), option("C"), option("D")]),
    question("q-2", "Тестовый 2", [option("A", true), option("B"), option("C"), option("D")]),
  ];
  const speechList = [speechQuestion("speech-javascript-event-loop-001", "Расскажи про event loop"), speechQuestion("speech-javascript-event-loop-002", "Расскажи про микрозадачи")];
  await withBank({ questions, speech: speechList }, async () => {
    const context = await t.newContext({ serviceWorkers: "block" });
    const page = await context.newPage();
    await page.goto(t.url);
    await page.getByRole("heading", { name: "Тренажёр" }).waitFor();
    check("плитка «Устные вопросы» на главной", await visible(page.getByRole("button", { name: /Устные вопросы/ })));
    check("без галки — только тестовые", await visible(page.getByText(/^Под фильтр подходит 2 вопроса$/)));
    await openSettings(page);
    await page.getByText("Добавлять устные вопросы").click();
    check("с галкой — тестовые и устные", await visible(page.getByText(/^Под фильтр подходит 4 вопроса$/)));
    await page.getByRole("button", { name: "Назад" }).click();
    check("на главной — тоже 4, в сводке «с устными»", (await visible(page.getByText(/^Под фильтр подходит 4 вопроса$/))) && (await visible(page.getByText(/· с устными$/))));
    await openSettings(page);
    await page.getByText("Добавлять устные вопросы").click();
    await page.getByRole("button", { name: "Назад" }).click();

    await page.getByRole("button", { name: /Устные вопросы/ }).click();
    check("раздел устных: свой экран", await visible(page.getByRole("heading", { name: "Устные вопросы" })));
    check("раздел устных: только устные", await visible(page.getByText(/^Под фильтр подходит 2 вопроса$/)));
    await page.getByRole("button", { name: /^Начать/ }).click();
    check("сессия раздела — устная", await visible(page.getByRole("button", { name: "Показать ответ" })));
    await context.close();
  });
}
