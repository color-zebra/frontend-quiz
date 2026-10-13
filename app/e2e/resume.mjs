// Продолжение сессии после перезапуска и плашка «Вышла новая база» с обновлением из кабинета.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chooseLength, openCabinet, option, question, withBank } from "./fixtures.mjs";
import { DIST_DIR } from "./lib.mjs";

const four = (id) => [option(`${id}-верно`, true), option(`${id}-нет1`), option(`${id}-нет2`), option(`${id}-нет3`)];
const VERSION = join(DIST_DIR, "questions-version.json");
const QUESTIONS = join(DIST_DIR, "questions.json");

export default async function resume(t) {
  const { check, visible } = t;
  const questions = ["r1", "r2", "r3"].map((id) => question(id, `ВОПРОС-${id}`, four(id)));

  await withBank({ questions }, async () => {
    const context = await t.newContext({ serviceWorkers: "block" });
    const page = await context.newPage();
    const banner = page.getByRole("status").filter({ hasText: "Незаконченная сессия" });
    const currentId = async () => (await page.locator("article").first().innerText()).match(/ВОПРОС-(r\d)/)[1];
    const home = async () => {
      await page.goto(t.url);
      await page.getByText("Что тренируем?").waitFor();
    };

    await home();
    check("без прерванной сессии плашки нет", !(await visible(banner, 800)));
    await chooseLength(page, "10");
    await page.getByRole("button", { name: /^Начать/ }).click();
    await page.locator("ol li button").filter({ hasText: `${await currentId()}-верно` }).click();
    await page.getByRole("button", { name: "Дальше" }).click();
    await page.getByText("2 / 3").waitFor();
    const second = await currentId();

    // Перезапуск посреди сессии — как будто Android выгрузил приложение.
    await page.reload();
    await page.getByText("Что тренируем?").waitFor();
    check("после перезапуска — плашка «Незаконченная сессия · вопрос 2 из 3»", await visible(banner.getByText("вопрос 2 из 3")));
    await t.shot(page, "banner");
    await banner.getByRole("button", { name: "Продолжить" }).click();
    check("«Продолжить» — тот же вопрос 2 из 3", (await visible(page.getByText("2 / 3"))) && (await currentId()) === second);
    for (let i = 2; i <= 3; i++) {
      await page.getByText(`${i} / 3`).waitFor();
      await page.locator("ol li button").filter({ hasText: `${await currentId()}-верно` }).click();
      await page.getByRole("button", { name: i === 3 ? "Завершить" : "Дальше" }).click();
    }
    check("итог — все 3 ответа, первый не потерялся", await visible(page.getByText("3 / 3")));
    await home();
    check("ответы не задвоились: новых 0, ошибок 0", (await page.getByRole("button", { name: "Новые · 0" }).count()) === 1);
    check("после итога плашки нет", !(await visible(banner, 800)));

    // «×» выбрасывает сессию насовсем.
    await page.getByRole("button", { name: /^Начать/ }).click();
    await page.getByRole("button", { name: "Не знаю" }).click();
    await page.reload();
    await page.getByText("Что тренируем?").waitFor();
    await banner.getByRole("button", { name: "Не продолжать сессию" }).click();
    check("«×» убирает плашку", !(await visible(banner, 800)));
    await page.reload();
    await page.getByText("Что тренируем?").waitFor();
    check("и после перезапуска её нет", !(await visible(banner, 800)));
    await context.close();
  });

  // Плашка «Вышла новая база»: на сервере база свежее той, что на устройстве.
  const originalVersion = readFileSync(VERSION, "utf8");
  const originalQuestions = readFileSync(QUESTIONS, "utf8");
  try {
    const context = await t.newContext({ serviceWorkers: "block" });
    const page = await context.newPage();
    const newBank = page.getByRole("status").filter({ hasText: "Вышла новая база вопросов" });
    await page.goto(t.url);
    await page.getByText("Что тренируем?").waitFor();
    check("база свежая — плашки нет", !(await visible(newBank, 1500)));
    check("в шапке главной больше нет «Обновить базу»", !(await page.getByRole("button", { name: "Обновить базу" }).isVisible()));
    await openCabinet(page, t.url);
    check("в кабинете — блок «База вопросов» с кнопкой", await visible(page.getByRole("button", { name: "Обновить базу" })));

    // Выкладываем новую базу: один новый вопрос и свежая дата сборки.
    const fresh = JSON.parse(originalQuestions);
    fresh.generatedAt = "2099-01-01T00:00:00.000Z";
    fresh.questions.push({ ...fresh.questions[0], id: "test-fresh-001" });
    writeFileSync(QUESTIONS, JSON.stringify(fresh));
    writeFileSync(VERSION, JSON.stringify({ generatedAt: fresh.generatedAt }));

    await page.goto(t.url);
    await page.getByText("Что тренируем?").waitFor();
    check("вышла новая база — плашка на главной", await visible(newBank));
    await t.shot(page, "new-bank");
    await newBank.getByRole("button", { name: "Не сейчас" }).click();
    await page.reload();
    await page.getByText("Что тренируем?").waitFor();
    check("закрытая плашка про эту версию не возвращается", !(await visible(newBank, 1500)));

    // Ещё более свежая база — плашка снова; «Обновить» прямо в ней.
    fresh.generatedAt = "2099-02-01T00:00:00.000Z";
    writeFileSync(QUESTIONS, JSON.stringify(fresh));
    writeFileSync(VERSION, JSON.stringify({ generatedAt: fresh.generatedAt }));
    await page.reload();
    await newBank.waitFor();
    await newBank.getByRole("button", { name: "Обновить" }).click();
    check("«Обновить» в плашке — база обновлена: новых 1", await visible(page.getByText("База обновлена: новых 1.")));
    check("после обновления плашки нет", !(await newBank.isVisible()));
    await page.reload();
    await page.getByText("Что тренируем?").waitFor();
    check("и после перезапуска — база свежая, плашки нет", !(await visible(newBank, 1500)));
    await context.close();
  } finally {
    writeFileSync(VERSION, originalVersion);
    writeFileSync(QUESTIONS, originalQuestions);
  }
}
