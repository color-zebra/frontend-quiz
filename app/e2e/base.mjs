// Основная база: загрузка и офлайн-копия, сессия, заметка, подтемы, «Обновить», бесконечный режим.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DIST_DIR } from "./lib.mjs";

const QUESTIONS = join(DIST_DIR, "questions.json");

export default async function base(t) {
  const { check, visible } = t;
  const original = readFileSync(QUESTIONS, "utf8");
  const data = JSON.parse(original);
  const total = data.questions.length;
  const firstTopic = data.topics[0];
  const firstTopicCount = data.questions.filter((q) => q.topic === firstTopic.id).length;

  try {
    // Первый запуск без связи: экран ошибки и повтор.
    {
      const context = await t.newContext({ serviceWorkers: "block" });
      const page = await context.newPage();
      await page.route("**/questions.json*", (route) => route.abort());
      await page.goto(t.url);
      check("без связи при первом запуске — экран ошибки", await visible(page.getByText("Не удалось загрузить вопросы")));
      check("причина ошибки понятная", await visible(page.getByText("Нет связи с сервером")));
      await page.unroute("**/questions.json*");
      await page.getByRole("button", { name: "Попробовать ещё раз" }).click();
      check("повтор после появления связи — главная", await visible(page.getByText("Что тренируем?")));
      await context.close();
    }

    const context = await t.newContext({ serviceWorkers: "block" });
    const page = await context.newPage();
    let requests = 0;
    page.on("request", (r) => r.url().includes("questions.json") && requests++);

    await page.goto(t.url);
    await page.getByText("Что тренируем?").waitFor();
    check("первый запуск скачал базу один раз", requests === 1, `запросов: ${requests}`);
    check("подзаголовок с числом вопросов и датой базы", await visible(page.getByText(new RegExp(`^${total} вопрос\\S* · база от `))));
    check(`под фильтр все ${total} вопросов`, await visible(page.getByText(new RegExp(`^Под фильтр подходит ${total} `))));
    requests = 0;
    await page.reload();
    await page.getByText("Что тренируем?").waitFor();
    await page.waitForTimeout(300);
    check("повторное открытие — без сети, из копии на устройстве", requests === 0, `запросов: ${requests}`);

    // Сессия на 10 вопросов с заметкой.
    await page.getByRole("button", { name: "10", exact: true }).click();
    await page.getByRole("button", { name: "Начать · 10 вопросов" }).click();
    for (let i = 1; i <= 10; i++) {
      await page.getByText(`${i} / 10`).waitFor();
      await page.keyboard.press(String(((i - 1) % 4) + 1));
      if (await page.getByRole("button", { name: "Ответить" }).isVisible()) await page.keyboard.press("Enter");
      if (i === 1) {
        await page.getByRole("button", { name: "Заметка", exact: true }).click();
        await page.getByRole("textbox").fill("Проверочная заметка");
        await page.getByRole("button", { name: "Сохранить" }).click();
        check("кнопка заметки подсвечена, когда заметка есть", await visible(page.getByRole("button", { name: "Изменить заметку" })));
        check("сама заметка на экране не показывается", !(await page.getByText("Проверочная заметка").isVisible()));
      }
      if (i === 2) await t.shot(page, "answered", true);
      await page.keyboard.press("Enter");
    }
    check("сессия на 10 доходит до итога", await visible(page.getByText("Отвечено 10 вопросов")));
    await t.shot(page, "summary", true);
    await page.getByRole("button", { name: "На главную" }).click();
    await page.getByText("Что тренируем?").waitFor();

    // Подтемы.
    await page.getByRole("button", { name: /Подтемы/ }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Снять все" }).first().click();
    await page.keyboard.press("Escape");
    check(
      `снятие подтем «${firstTopic.title}» сужает пул`,
      await visible(page.getByText(new RegExp(`^Под фильтр подходит ${total - firstTopicCount} `))),
    );
    await page.getByRole("button", { name: /Подтемы/ }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Выбрать все" }).first().click();
    await page.keyboard.press("Escape");

    // «Обновить»: правим файл на сервере.
    await page.getByRole("button", { name: "Обновить базу" }).click();
    check("обновление без изменений", await visible(page.getByText("У тебя самая свежая база.")));
    const edited = JSON.parse(original);
    edited.questions.pop();
    edited.questions[0] = { ...edited.questions[0], question: `${edited.questions[0].question} (правка)` };
    edited.questions.push({ ...edited.questions[1], id: "test-new-001" }, { ...edited.questions[2], id: "test-new-002" });
    writeFileSync(QUESTIONS, JSON.stringify(edited));
    await page.getByRole("button", { name: "Обновить базу" }).click();
    check("сводка: новых 2, исправлено 1, удалено 1", await visible(page.getByText("База обновлена: новых 2, исправлено 1, удалено 1.")));
    await page.reload();
    await page.getByText("Что тренируем?").waitFor();
    check("обновлённая база сохранилась на устройстве", await visible(page.getByText(new RegExp(`^${total + 1} вопрос\\S* · база`))));
    await page.route("**/questions.json*", (route) => route.abort());
    await page.getByRole("button", { name: "Обновить базу" }).click();
    check("обновление без связи — понятная ошибка", await visible(page.getByText("Не удалось обновить: Нет связи с сервером")));
    await page.unroute("**/questions.json*");
    writeFileSync(QUESTIONS, original);
    await page.getByRole("button", { name: "Обновить базу" }).click();
    check("возврат исходной базы", await visible(page.getByText("База обновлена: новых 1, исправлено 1, удалено 2.")));

    // Заметки.
    await page.getByRole("button", { name: /Мои заметки/ }).click();
    check("заметка в списке заметок", await visible(page.getByText("Проверочная заметка")));
    await page.getByRole("button", { name: "Назад" }).click();

    // Бесконечный режим и системная «Назад».
    await page.getByRole("button", { name: "∞", exact: true }).click();
    await page.getByRole("button", { name: "Начать · без конца" }).click();
    for (let i = 1; i <= 3; i++) {
      await page.getByText(new RegExp(`^Вопрос ${i} ·`)).waitFor();
      await page.keyboard.press("2");
      if (await page.getByRole("button", { name: "Ответить" }).isVisible()) await page.keyboard.press("Enter");
      await page.keyboard.press("Enter");
    }
    await page.goBack();
    check("«Назад» посреди бесконечной сессии — итог", await visible(page.getByText("Отвечено 3 вопроса")));
    await context.close();
  } finally {
    writeFileSync(QUESTIONS, original);
  }
}
