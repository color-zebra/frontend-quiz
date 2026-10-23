// Закладки «Вернуться позже»: третья кнопка капсулы, раздел в статистике, разбор, «Прорешать отмеченные»,
// «Снять все закладки» с подтверждением; сброс статистики закладки не трогает; капсула на 330px.
import { chooseLength, openCabinet, option, question, withBank } from "./fixtures.mjs";

const four = (id) => [option(`${id}-верно`, true), option(`${id}-нет1`), option(`${id}-нет2`), option(`${id}-нет3`)];

export default async function bookmarks(t) {
  const { check, visible } = t;
  const questions = ["b1", "b2", "b3"].map((id) => question(id, `ВОПРОС-${id}`, four(id)));

  await withBank({ questions }, async () => {
    const context = await t.newContext({ serviceWorkers: "block" });
    const page = await context.newPage();
    const mark = page.getByRole("button", { name: "Вернуться позже" });
    const unmark = page.getByRole("button", { name: "Убрать из «Вернуться позже»" });
    const section = page.locator("section").filter({ hasText: /^Вернуться позже/ });
    const openStats = async () => {
      await openCabinet(page, t.url);
      await page.getByRole("button", { name: /^Статистика/ }).click();
      await page.getByRole("heading", { name: "Статистика" }).waitFor();
    };

    await page.goto(t.url);
    await page.getByRole("button", { name: /^Начать/ }).click();
    const id = (await page.locator("article").first().innerText()).match(/ВОПРОС-(b\d)/)[1];
    check("в капсуле — закладка, вопрос не отмечен", (await mark.getAttribute("aria-pressed")) === "false");
    await mark.click();
    check("нажатие отмечает вопрос", (await unmark.getAttribute("aria-pressed")) === "true");
    await t.shot(page, "capsule");
    await page.getByRole("button", { name: "Выйти из сессии" }).click();

    await openStats();
    check("в статистике — «Вернуться позже · 1», даже без ответов", await visible(page.getByText("Вернуться позже · 1")));
    check("в нём отмеченный вопрос", await visible(section.getByText(`ВОПРОС-${id}`)));
    await t.shot(page, "stats", true);
    await section.getByRole("button", { name: new RegExp(`ВОПРОС-${id}`) }).click();
    check("нажатие — разбор вопроса, закладка на месте", (await visible(page.getByText("Разбор вопроса"))) && (await visible(unmark)));
    await page.getByRole("button", { name: "Назад" }).first().click();
    await section.getByRole("button", { name: "Прорешать отмеченные · 1" }).click();
    check("«Прорешать отмеченные» — сессия из отмеченного", (await visible(page.getByText("1 / 1"))) && (await visible(page.getByText(`ВОПРОС-${id}`))));
    await page.locator("ol li button").filter({ hasText: `${id}-верно` }).click();
    await page.getByRole("button", { name: "Завершить" }).click();

    // Верный ответ закладку не снимает; сброс статистики — тоже.
    await openCabinet(page, t.url);
    await page.getByRole("button", { name: "Сбросить статистику" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Сбросить" }).click();
    await page.getByRole("button", { name: /^Статистика/ }).click();
    check("верный ответ и сброс статистики закладку не сняли", await visible(page.getByText("Вернуться позже · 1")));

    // «Снять все закладки»: «Оставить» не трогает, «Снять» снимает.
    await section.getByRole("button", { name: "Снять все закладки" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Оставить" }).click();
    check("«Оставить» — закладка на месте", await visible(page.getByText("Вернуться позже · 1")));
    await section.getByRole("button", { name: "Снять все закладки" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Снять" }).click();
    check("«Снять» — раздела больше нет", !(await visible(page.getByText(/^Вернуться позже/), 800)));
    await page.reload();
    await openStats();
    check("и после перезапуска закладок нет", !(await visible(page.getByText(/^Вернуться позже/), 800)));

    // Повторное нажатие на закладку снимает её.
    await page.goto(t.url);
    await page.getByRole("button", { name: /^Начать/ }).click();
    await mark.click();
    await unmark.click();
    check("повторное нажатие снимает закладку", (await mark.getAttribute("aria-pressed")) === "false");
    await context.close();
  });

  // Капсула из трёх кнопок на узком экране: все по 44px, шапка не вылезает вбок.
  const narrow = await t.newContext({ serviceWorkers: "block", viewport: { width: 330, height: 640 } });
  const p = await narrow.newPage();
  await p.goto(t.url);
  await chooseLength(p, "∞");
  await p.getByRole("button", { name: /^Начать/ }).click();
  const tools = ["Не согласен с вопросом", "Вернуться позже", "Заметка"];
  const boxes = await Promise.all(tools.map((name) => p.getByRole("button", { name, exact: true }).boundingBox()));
  check("330px: три кнопки капсулы по 44px", boxes.every((b) => b && b.width === 44 && b.height === 44));
  check("330px: шапка не вылезает вбок", (await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) === 0);
  await t.shot(p, "narrow");
  await narrow.close();
}
