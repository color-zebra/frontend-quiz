// Ачивки: всё не получено в начале, новые — в итоге сессии и только один раз, шторка по нажатию,
// «Не знаю» считается, ночь, сброс статистики стирает ачивки.
import { answerRecord, openCabinet, option, question, seedAnswers, withBank } from "./fixtures.mjs";

const four = (id) => [option(`${id}-верно`, true), option(`${id}-нет1`), option(`${id}-нет2`), option(`${id}-нет3`)];
const html = { topic: "html", subtopic: "x" };

export default async function achievements(t) {
  const { check, visible } = t;
  const ids = Array.from({ length: 10 }, (_, i) => `h${i}`);
  const questions = ids.map((id) => question(id, `ВОПРОС-${id}`, four(id), html));

  await withBank({ questions }, async () => {
    const context = await t.newContext({ serviceWorkers: "block" });
    // Часы — на среду, полдень: иначе прогон в пятницу вечером или ночью сам выдаёт «Деплой в пятницу»
    // и «Ночной деплой», и счёт достижений не сходится.
    await context.clock.install({ time: new Date(2026, 0, 14, 12, 0) });
    const page = await context.newPage();
    const tile = page.getByRole("button", { name: /^Достижения/ });
    const card = (title) => page.getByRole("button", { name: new RegExp(`^${title}`) });
    const openAchievements = async () => {
      await openCabinet(page, t.url);
      await tile.click();
      await page.getByRole("heading", { name: "Достижения" }).waitFor();
    };
    /** Отвечает на один вопрос сессии (верно или «Не знаю») и выходит в итог. */
    const answerOneAndFinish = async (how = "верно") => {
      await page.goto(t.url);
      await page.getByText("Что тренируем?").waitFor();
      await page.getByRole("button", { name: /^Начать/ }).click();
      if (how === "не знаю") await page.getByRole("button", { name: "Не знаю" }).click();
      else {
        const id = (await page.locator("article").first().innerText()).match(/ВОПРОС-(h\d)/)[1];
        await page.locator("ol li button").filter({ hasText: `${id}-верно` }).click();
      }
      await page.getByRole("button", { name: "Выйти из сессии" }).click();
      await page.getByText(/^Сессия завершена/).waitFor();
    };

    await openCabinet(page, t.url);
    check("в кабинете — «получено 0 из 20»", await visible(tile.getByText("получено 0 из 20")));
    await tile.click();
    check("на старте ничего не получено", await visible(page.getByText("Получено 0 из 20 · по основной базе")));
    check("у карточки — «X из Y»", await visible(card("Hello world").getByText("0 из 10", { exact: true })));

    await card("Клуб ста").click();
    const sheet = page.getByRole("dialog");
    check(
      "по нажатию — шторка с подробным описанием",
      (await visible(sheet.getByText(/^Ответь на 100 вопросов основной базы/))) && (await visible(sheet.getByText("0 из 100"))),
    );
    await page.keyboard.press("Escape");

    // 9 верных ответов до сессии: <body>билдер (80 % HTML) уже получен. Десятый ответ — в сессии: Hello world и Снайпер.
    // Время старых ответов — полдень среды в прошлом: ни ночь, ни пятничный вечер. С меткой около нуля (03:00
    // по Москве) прогон после полуночи давал лишний «Ночной деплой»: к девяти «ночным» добавлялись ответы сессии.
    const noon = new Date(2026, 0, 14, 12, 0).getTime();
    await seedAnswers(page, ids.slice(0, 9).map((id, i) => answerRecord(id, noon + i * 60_000, true)));
    await answerOneAndFinish();
    const fresh = page.locator("section").filter({ hasText: "Новые достижения" });
    check("в итоге — блок «Новые достижения»", await visible(fresh));
    check(
      "в нём Hello world и Снайпер, а полученного до сессии <body>билдера нет",
      (await visible(fresh.getByText("Hello world"))) &&
        (await visible(fresh.getByText("Снайпер"))) &&
        !(await fresh.getByText("<body>билдер").isVisible()),
    );
    await t.shot(page, "summary", true);

    await answerOneAndFinish();
    check("полученные второй раз не показываются", !(await page.getByText("Новые достижения").isVisible()));

    await openAchievements();
    check("на экране — 3 из 20", await visible(page.getByText("Получено 3 из 20 · по основной базе")));
    check("у полученного — дата", await visible(card("Hello world").getByText(/^получено \d+ \S+$/)));

    // «Не знаю» записывается отдельно и идёт в «Я знаю, что ничего не знаю».
    await answerOneAndFinish("не знаю");
    await openAchievements();
    check("«Не знаю» засчитано: 1 из 20", await visible(card("Я знаю, что ничего не знаю").getByText("1 из 20")));

    // 10 ответов ночью — «Ночной деплой».
    const night = new Date(2026, 9, 10, 2, 0).getTime();
    await seedAnswers(page, ids.map((id, i) => answerRecord(id, night + i * 60_000, true)));
    await openAchievements();
    check("10 ночных ответов — «Ночной деплой»", await visible(card("Ночной деплой").getByText(/^получено/)));
    await t.shot(page, "screen", true);

    // Сброс статистики стирает ачивки.
    await openCabinet(page, t.url);
    await page.getByRole("button", { name: "Сбросить статистику" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Сбросить" }).click();
    check("после сброса — снова 0 из 20", await visible(tile.getByText("получено 0 из 20")));
    await context.close();
  });
}
