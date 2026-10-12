// Статистика: пусто до ответов, «видел» и точность, отстающие темы сверху, «Прорешать» из слабых мест,
// устные вопросы, «последние 100», сброс с подтверждением.
import { option, question, speechQuestion, withBank } from "./fixtures.mjs";

const four = (id) => [option(`${id}-верно`, true), option(`${id}-нет1`), option(`${id}-нет2`), option(`${id}-нет3`)];
const react = { topic: "react", subtopic: "effects" };

/** Кладёт записи прямо в ленту ответов на устройстве; порядок вопросов в сессии на них не влияет. */
function seed(page, records) {
  return page.evaluate(
    (list) =>
      new Promise((resolve, reject) => {
        const open = indexedDB.open("frontend-quiz-progress");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const tx = open.result.transaction("answers", "readwrite");
          list.forEach((record, i) => tx.objectStore("answers").put(record, `seed-${record.at}-${i}`));
          tx.oncomplete = () => resolve(undefined);
          tx.onerror = () => reject(tx.error);
        };
      }),
    records,
  );
}

const answerRecord = (questionId, at, correct) => ({ setId: "builtin", questionId, at, correct });

export default async function stats(t) {
  const { check, visible } = t;
  const questions = [
    question("j1", "ВОПРОС-J1", four("J1")),
    question("j2", "ВОПРОС-J2", four("J2")),
    question("j3", "ВОПРОС-J3", four("J3")),
    question("r1", "ВОПРОС-R1", four("R1"), react),
    question("r2", "ВОПРОС-R2", four("R2"), react),
  ];
  const speech = [speechQuestion("speech-javascript-event-loop-001", "УСТНЫЙ-S1")];

  await withBank({ questions, speech }, async () => {
    const context = await t.newContext({ serviceWorkers: "block" });
    const page = await context.newPage();
    const tile = page.getByRole("button", { name: /^Статистика/ });
    const home = async () => {
      await page.goto(t.url);
      await page.getByText("Что тренируем?").waitFor();
    };
    const openStats = async () => {
      await home();
      await tile.click();
      await page.getByRole("heading", { name: "Статистика" }).waitFor();
    };
    const resetButton = page.getByRole("button", { name: "Сбросить статистику" });

    await home();
    check("плитка до ответов — «ещё нет ответов»", await visible(tile.getByText("ещё нет ответов")));
    await tile.click();
    check("пустая статистика — понятный текст", await visible(page.getByText(/^Пока нет ни одного ответа/)));
    check("без ответов кнопки сброса нет", !(await resetButton.isVisible()));

    // J1 неверно, J2 верно, R1 неверно: J3 и R2 не видел.
    await seed(page, [answerRecord("j1", 1, false), answerRecord("j2", 2, true), answerRecord("r1", 3, false)]);
    await home();
    check("плитка: «видел 3 из 5»", await visible(tile.getByText("видел 3 из 5")));
    await openStats();
    check("«Видел 3 из 5 вопросов»", (await page.getByText(/^Видел \d+ из \d+ вопросов$/).innerText()) === "Видел 3 из 5 вопросов");
    check("«Верных ответов: 33 % — из 3 ответов»", await visible(page.getByText("Верных ответов: 33 % — из 3 ответов")));
    check("«за последние 100» нет, пока ответов меньше сотни", !(await page.getByText(/За последние/).isVisible()));
    const bars = page.getByRole("img");
    check(
      "отстающая тема сверху: React (освоено 0) выше JavaScript (освоено 1)",
      (await bars.nth(0).getAttribute("aria-label")).startsWith("React: освоено 0, в ошибках 1, не видел 1 из 2") &&
        (await bars.nth(1).getAttribute("aria-label")).startsWith("JavaScript: освоено 1, в ошибках 1, не видел 1 из 3"),
    );
    check("в слабых местах обе подтемы с ошибками", (await page.getByRole("button", { name: /Прорешать/ }).count()) === 2);
    await t.shot(page, "screen", true);

    await page.getByRole("button", { name: /React.*Прорешать/ }).click();
    check("«Прорешать» запускает ошибку этой подтемы", (await visible(page.getByText("1 / 1"))) && (await visible(page.getByText("ВОПРОС-R1"))));

    // Устный вопрос: «Частично» — в блоке устных.
    await home();
    await page.getByRole("button", { name: /Устные вопросы/ }).click();
    await page.getByRole("button", { name: /^Начать/ }).click();
    await page.getByRole("button", { name: "Показать ответ" }).click();
    await page.getByRole("button", { name: "Частично" }).click();
    await page.getByText(/^Сессия завершена/).waitFor();
    await openStats();
    check("устные — по последней самооценке", await visible(page.getByText(/знал 0 · частично 1 · не\s+знал 0/)));

    // Сброс: «Отмена» ничего не стирает, «Сбросить» — всё.
    await resetButton.click();
    await page.getByRole("dialog").getByRole("button", { name: "Отмена" }).click();
    check("«Отмена» — статистика на месте", await visible(page.getByText("Видел 3 из 5 вопросов")));
    await resetButton.click();
    await t.shot(page, "confirm");
    await page.getByRole("dialog").getByRole("button", { name: "Сбросить" }).click();
    check("после сброса статистика пустая", await visible(page.getByText(/^Пока нет ни одного ответа/)));
    await page.reload();
    await page.getByText("Что тренируем?").waitFor();
    check("и после перезагрузки тоже: «ещё нет ответов»", await visible(tile.getByText("ещё нет ответов")));
    check(
      "все вопросы снова новые, ошибок нет",
      (await page.getByRole("group", { name: "Какие вопросы" }).innerText()).replace(/\s+/g, " ").includes("Новые · 5 Ошибки · 0"),
    );
    await context.close();

    // «Последние 100»: 120 ответов в ленте — первые 20 неверные, последние 100 верные.
    const seeded = await t.newContext({ serviceWorkers: "block" });
    const p = await seeded.newPage();
    await p.goto(t.url);
    await p.getByText("Что тренируем?").waitFor();
    await seed(p, Array.from({ length: 120 }, (_, i) => answerRecord("j3", 1000 + i, i >= 20)));
    await p.reload();
    await p.getByRole("button", { name: /^Статистика/ }).click();
    check("точность за всё время: 83 % из 120", await visible(p.getByText("Верных ответов: 83 % — из 120 ответов")));
    check("за последние 100 — 100 %", await visible(p.getByText("За последние 100: 100 %")));
    await seeded.close();
  });
}
