// Статистика: пусто до ответов, «видел» и точность, отстающие темы сверху, «Прорешать» из слабых мест,
// устные вопросы, «последние 100». Вход — через кабинет.
import { answerRecord, fileInput, openCabinet, option, question, seedAnswers, speechQuestion, withBank } from "./fixtures.mjs";

const four = (id) => [option(`${id}-верно`, true), option(`${id}-нет1`), option(`${id}-нет2`), option(`${id}-нет3`)];
const react = { topic: "react", subtopic: "effects" };

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
    const openStats = async () => {
      await openCabinet(page, t.url);
      await tile.click();
      await page.getByRole("heading", { name: "Статистика" }).waitFor();
    };

    await openCabinet(page, t.url);
    check("в кабинете плитка до ответов — «ещё нет ответов»", await visible(tile.getByText("ещё нет ответов")));
    await tile.click();
    check("пустая статистика — понятный текст", await visible(page.getByText(/^Пока нет ни одного ответа/)));

    // J1 неверно, J2 верно, R1 неверно: J3 и R2 не видел.
    await seedAnswers(page, [answerRecord("j1", 1, false), answerRecord("j2", 2, true), answerRecord("r1", 3, false)]);
    await openCabinet(page, t.url);
    check("плитка: «видел 3 из 5 · верных 33 %»", await visible(tile.getByText("видел 3 из 5 · верных 33 %")));
    await tile.click();
    check(
      "«Видел 3 из 5 вопросов»",
      (await page.getByText(/^Видел \d+ из \d+ вопросов$/).innerText()) === "Видел 3 из 5 вопросов",
    );
    check("«Верных ответов: 33 % — из 3 ответов»", await visible(page.getByText("Верных ответов: 33 % — из 3 ответов")));
    check("«за последние 100» нет, пока ответов меньше сотни", !(await page.getByText(/За последние/).isVisible()));
    const bars = page.getByRole("img");
    check(
      "отстающая тема сверху: React (освоено 0) выше JavaScript (освоено 1)",
      (await bars.nth(0).getAttribute("aria-label")).startsWith("React: освоено 0, в ошибках 1, не видел 1 из 2") &&
        (await bars.nth(1).getAttribute("aria-label")).startsWith("JavaScript: освоено 1, в ошибках 1, не видел 1 из 3"),
    );
    check("в слабых местах обе подтемы с ошибками", (await page.getByRole("button", { name: /Прорешать/ }).count()) === 2);
    check("сброса на экране статистики нет — он в кабинете", !(await page.getByRole("button", { name: "Сбросить статистику" }).isVisible()));
    await t.shot(page, "screen", true);


    // R1 теперь отвечен верно один раз: ещё в ошибках, но «закрепить».
    await seedAnswers(page, [answerRecord("r1", 4, true)]);
    await openStats();
    check(
      "одна верная попытка видна: «ошибки: 1 · закрепить: 1»",
      await visible(page.getByRole("button", { name: /React/ }).getByText("ошибки: 1 · закрепить: 1")),
    );
    check(
      "на полоске React — «закрепить 1»",
      (await page.getByRole("img").first().getAttribute("aria-label")).endsWith("закрепить 1"),
    );
    check("у JavaScript верных попыток не было — только «ошибки: 1»", await visible(page.getByRole("button", { name: /^Прорешать: JavaScript/ }).getByText("ошибки: 1", { exact: true })));

    await page.getByRole("button", { name: /^Прорешать: React/ }).click();
    check(
      "«Прорешать» запускает ошибку этой подтемы",
      (await visible(page.getByText("1 / 1"))) && (await visible(page.getByText("ВОПРОС-R1"))),
    );

    // Устный вопрос: «Частично» — в блоке устных.
    await page.goto(t.url);
    await page.getByRole("button", { name: /Устные вопросы/ }).click();
    await page.getByRole("button", { name: /^Начать/ }).click();
    await page.getByRole("button", { name: "Показать ответ" }).click();
    await page.getByRole("button", { name: "Частично" }).click();
    await page.getByText(/^Сессия завершена/).waitFor();
    await openStats();
    check("устные — по последней самооценке", await visible(page.getByText(/знал 0 · частично 1 · не\s+знал 0/)));
    await context.close();

    // «Последние 100»: 120 ответов в ленте — первые 20 неверные, последние 100 верные.
    const seeded = await t.newContext({ serviceWorkers: "block" });
    const p = await seeded.newPage();
    await p.goto(t.url);
    await p.getByText("Что тренируем?").waitFor();
    await seedAnswers(p, Array.from({ length: 120 }, (_, i) => answerRecord("j3", 1000 + i, i >= 20)));
    await openCabinet(p, t.url);
    await p.getByRole("button", { name: /^Статистика/ }).click();
    check("точность за всё время: 83 % из 120", await visible(p.getByText("Верных ответов: 83 % — из 120 ответов")));
    check("за последние 100 — 100 %", await visible(p.getByText("За последние 100: 100 %")));

    // Свой набор: пока на него не отвечали — его нет в статистике; после ответов — своя карточка и слабые места.
    const setYaml = `title: Мой набор
questions:
${["s1", "s2", "s3"]
  .map(
    (id) =>
      `  - id: ${id}\n    level: junior\n    topic: Протокол\n    question: НАБОР-${id}\n    options:\n` +
      `      - text: ${id}-верно\n        correct: true\n      - text: ${id}-нет\n`,
  )
  .join("")}`;
    await p.goto(t.url);
    await p.getByRole("button", { name: /Мои наборы/ }).click();
    await p.locator('input[type="file"]').setInputFiles(fileInput("my.yaml", setYaml));
    await openCabinet(p, t.url);
    await p.getByRole("button", { name: /^Статистика/ }).click();
    check("набор без ответов в статистике не показан", !(await p.getByText("Набор «Мой набор»").isVisible()));

    await p.goto(t.url);
    await p.getByRole("button", { name: /Мои наборы/ }).click();
    await p.getByRole("button", { name: /^Мой набор/ }).click();
    await p.getByRole("button", { name: /^Начать/ }).click();
    const wrongId = (await p.locator("article").first().innerText()).match(/НАБОР-(s\d)/)[1];
    await p.locator("ol li button").filter({ hasText: `${wrongId}-нет` }).click();
    await p.getByRole("button", { name: "Выйти из сессии" }).click();
    await openCabinet(p, t.url);
    await p.getByRole("button", { name: /^Статистика/ }).click();
    const setCard = p.locator("details").filter({ hasText: "Набор «Мой набор»" });
    const setWeak = setCard.getByRole("button", { name: /^Прорешать: Протокол/ });
    check("после ответа — карточка набора, свёрнутая", (await visible(setCard)) && !(await setCard.getAttribute("open") !== null));
    check("в свёрнутой — строка итогов «видел 1 из 3 · верных 0 %»", await visible(setCard.getByText("видел 1 из 3 · верных 0 %")));
    check("основная база посчитана отдельно: 120 ответов", await visible(p.getByText("Верных ответов: 83 % — из 120 ответов")));
    await t.shot(p, "with-set-closed", true);

    await setCard.getByText("Набор «Мой набор»").click();
    check("по нажатию раскрывается: «Видел 1 из 3 вопросов»", await visible(setCard.getByText("Видел 1 из 3 вопросов")));
    check("слабые места набора — внутри его карточки", await visible(setWeak));
    check(
      "слабые места базы — отдельно, под базой, без подтемы набора",
      (await p.locator("section").filter({ hasText: "Слабые места" }).getByRole("button", { name: /Протокол/ }).count()) === 0,
    );
    await t.shot(p, "with-set-open", true);
    await openCabinet(p, t.url);
    await p.getByRole("button", { name: /^Статистика/ }).click();
    await setCard.waitFor();
    check("раскрытый набор запомнен", (await setCard.getAttribute("open")) !== null);
    await setWeak.click();
    check("«Прорешать» запускает ошибку из набора", await visible(p.getByText(`НАБОР-${wrongId}`)));
    await seeded.close();
  });
}
