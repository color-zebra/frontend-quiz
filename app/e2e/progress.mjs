// Лента ответов: «Все / Новые / Ошибки» в фильтрах, выход из ошибок после двух верных подряд, запись при выходе
// посреди сессии, сохранение после перезагрузки, сброс ошибки у исправленного вопроса, устные оценки.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { option, question, speechQuestion, withBank } from "./fixtures.mjs";
import { DIST_DIR } from "./lib.mjs";

const four = (prefix) => [option(`${prefix}-верно`, true), option(`${prefix}-нет1`), option(`${prefix}-нет2`), option(`${prefix}-нет3`)];

export default async function progress(t) {
  const { check, visible } = t;
  const questions = ["P1", "P2", "P3", "P4"].map((id) => question(id.toLowerCase(), `ВОПРОС-${id}`, four(id)));
  const speech = [speechQuestion("speech-javascript-event-loop-001", "УСТНЫЙ-S1")];

  await withBank({ questions, speech }, async () => {
    const context = await t.newContext({ serviceWorkers: "block" });
    const page = await context.newPage();
    const modes = page.getByRole("group", { name: "Какие вопросы" });
    const segment = (name) => modes.getByRole("button", { name: new RegExp(`^${name}`) });
    const label = async (name) => (await segment(name).innerText()).trim();
    const home = async () => {
      await page.goto(t.url);
      await page.getByText("Что тренируем?").waitFor();
    };
    /** Отвечает на текущий вопрос: «верно», «неверно» или «не знаю»; возвращает id вопроса из его текста. */
    const answer = async (how) => {
      const id = (await page.locator("article").first().innerText()).match(/ВОПРОС-(P\d)/)[1];
      if (how === "не знаю") {
        await page.getByRole("button", { name: "Не знаю" }).click();
        return id;
      }
      const suffix = how === "верно" ? "-верно" : "-нет1";
      await page.locator("ol li button").filter({ hasText: `${id}${suffix}` }).click();
      return id;
    };
    const start = async (mode) => {
      await segment(mode).click();
      await page.getByRole("button", { name: "10", exact: true }).click();
      await page.getByRole("button", { name: /^Начать/ }).click();
    };

    await home();
    check("сначала все вопросы новые", (await label("Новые")) === "Новые · 4");
    check("«Ошибки» недоступны, пока ошибок нет", (await label("Ошибки")) === "Ошибки · 0" && (await segment("Ошибки").isDisabled()));
    await t.shot(page, "fresh");

    // Три ответа: неверно, верно, «Не знаю» — и выход посреди сессии.
    await start("Все");
    const wrong = await answer("неверно");
    await page.getByRole("button", { name: "Дальше" }).click();
    await answer("верно");
    await page.getByRole("button", { name: "Дальше" }).click();
    const gaveUp = await answer("не знаю");
    await page.getByRole("button", { name: "Выйти из сессии" }).click();
    check("в итоге — подсказка, что ошибки сохранены", await visible(page.getByText(/^Ошибки сохранены/)));
    await t.shot(page, "summary", true);
    await home();
    check("после выхода посреди сессии ответы записаны: новых 1", (await label("Новые")) === "Новые · 1");
    check("ошибка и «Не знаю» — в ошибках", (await label("Ошибки")) === "Ошибки · 2", `${wrong}, ${gaveUp}`);

    // Режим «Ошибки»: один верный ответ — ещё в ошибках, второй подряд — уходит.
    await segment("Ошибки").click();
    check("в режиме «Ошибки» под фильтр подходят только они", await visible(page.getByText("Под фильтр подходит 2 вопроса")));
    await t.shot(page, "mistakes-mode", true);
    for (let round = 1; round <= 2; round++) {
      await start("Ошибки");
      for (let i = 1; i <= 2; i++) {
        await page.getByText(`${i} / 2`).waitFor();
        await answer("верно");
        await page.getByRole("button", { name: i === 2 ? "Завершить" : "Дальше" }).click();
      }
      await home();
      if (round === 1) check("после одного верного ответа вопрос ещё в ошибках", (await label("Ошибки")) === "Ошибки · 2");
    }
    check("после двух верных подряд ошибок нет", (await label("Ошибки")) === "Ошибки · 0");
    check(
      "запомненный режим «Ошибки» без ошибок сам стал «Все»",
      (await segment("Все").getAttribute("aria-pressed")) === "true",
    );

    await page.reload();
    await page.getByText("Что тренируем?").waitFor();
    check("после перезагрузки ответы на месте: новых 1", (await label("Новые")) === "Новые · 1");

    // «Новые» — только неотвеченный вопрос; отвечаем на него неверно.
    await start("Новые");
    check("режим «Новые» — один вопрос", await visible(page.getByText("1 / 1")));
    const last = await answer("неверно");
    await page.getByRole("button", { name: "Завершить" }).click();
    await home();
    check("новых не осталось", (await label("Новые")) === "Новые · 0" && (await segment("Новые").isDisabled()));
    check("новая ошибка — в ошибках", (await label("Ошибки")) === "Ошибки · 1");

    // Вопрос исправили в базе — при обновлении он уходит из ошибок.
    const file = join(DIST_DIR, "questions.json");
    const bank = JSON.parse(readFileSync(file, "utf8"));
    bank.questions.find((q) => q.id === last.toLowerCase()).question = `ВОПРОС-${last} (исправлен)`;
    writeFileSync(file, JSON.stringify(bank));
    await page.getByRole("button", { name: "Обновить базу" }).click();
    await page.getByText(/исправлено 1/).waitFor();
    check("исправленный вопрос ушёл из ошибок", (await label("Ошибки")) === "Ошибки · 0");

    // Устный вопрос: оценка «Не знал» на последнем вопросе сразу ведёт в итог — и всё равно записана.
    await page.getByRole("button", { name: /Устные вопросы/ }).click();
    await start("Все");
    await page.getByRole("button", { name: "Показать ответ" }).click();
    await page.getByRole("button", { name: "Не знал" }).click();
    await page.getByText(/^Сессия завершена/).waitFor();
    await page.goto(t.url);
    await page.getByRole("button", { name: /Устные вопросы/ }).click();
    check("устное «Не знал» — в ошибках устного раздела", (await label("Ошибки")) === "Ошибки · 1");
    await context.close();
  });
}
