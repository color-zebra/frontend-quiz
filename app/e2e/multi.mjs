// Вопросы с несколькими ответами: галочки, «Ответить», засчёт «все и без лишних», пометки разбора.
import { option, question, withBank } from "./fixtures.mjs";

export default async function multi(t) {
  const { check, visible } = t;
  const questions = [
    question("t-multi-a", "MULTI-A: какие верны?", [option("A1", true), option("A2"), option("A3", true), option("A4"), option("A5")]),
    question("t-multi-b", "MULTI-B: какие верны?", [option("B1", true), option("B2"), option("B3"), option("B4")], { multiple: true }),
    question("t-single-c", "SINGLE-C: какой верен?", [option("C1"), option("C2", true), option("C3"), option("C4")]),
  ];

  await withBank({ questions }, async () => {
    const context = await t.newContext({ serviceWorkers: "block" });
    const page = await context.newPage();
    await page.goto(t.url);
    await page.getByText("Что тренируем?").waitFor();
    await page.getByRole("button", { name: "10", exact: true }).click();
    await page.getByRole("button", { name: "Начать · 3 вопроса" }).click();

    const optionButton = (text) => page.locator("ol li button").filter({ hasText: new RegExp(`^\\d?${text}`) });
    const positionOf = async (text) => {
      const texts = await page.locator("ol li button").evaluateAll((els) => els.map((el) => el.innerText.replace(/^\d\s*/, "").trim()));
      return texts.findIndex((x) => x.startsWith(text)) + 1;
    };
    const explanation = page.getByRole("heading", { name: "Как это устроено" });

    for (let i = 1; i <= 3; i++) {
      await page.getByText(`${i} / 3`).waitFor();
      const text = await page.locator("article").first().innerText();
      if (text.includes("MULTI-A")) {
        check("A: подсказка «Выберите все подходящие»", await visible(page.getByText("Выберите все подходящие варианты")));
        check("A: «Ответить» недоступна без галочек", await page.getByRole("button", { name: "Ответить" }).isDisabled());
        await page.keyboard.press(String(await positionOf("A1")));
        check(
          "A: цифра ставит галочку, ответ ещё не засчитан",
          (await optionButton("A1").getAttribute("aria-pressed")) === "true" && !(await visible(explanation, 500)),
        );
        await page.keyboard.press(String(await positionOf("A3")));
        await page.keyboard.press("Enter");
        check("A: Enter отвечает, все правильные — засчитано", await visible(page.getByText("Ответ засчитан")));
        check("A: обе правильные помечены «Верно»", (await page.locator("ol").getByText("Верно", { exact: true }).count()) === 2);
      } else if (text.includes("MULTI-B")) {
        check("B: multiple: true с одним правильным — тоже галочки", await visible(page.getByText("Выберите все подходящие варианты")));
        await optionButton("B2").click();
        await optionButton("B2").click();
        check("B: повторное нажатие снимает галочку", (await optionButton("B2").getAttribute("aria-pressed")) === "false");
        await optionButton("B2").click();
        await page.getByRole("button", { name: "Ответить" }).click();
        check("B: лишний вариант — не засчитано", await visible(page.getByText(/^Ответ не засчитан/)));
        check("B: правильный невыбранный — «Пропущен»", await visible(optionButton("B1").getByText("Пропущен")));
        check("B: неправильный выбранный — «Лишний»", await visible(optionButton("B2").getByText("Лишний")));
      } else {
        check("C: обычный вопрос — без подсказки про галочки", !(await visible(page.getByText("Выберите все подходящие варианты"), 500)));
        await optionButton("C2").click();
        check("C: обычный вопрос отвечается одним нажатием", await visible(explanation));
        check("C: «Верно» у выбранного правильного", await visible(optionButton("C2").getByText("Верно")));
      }
      await page.getByRole("button", { name: i === 3 ? "Завершить" : "Дальше" }).click();
    }

    check("итог: 2 из 3", await visible(page.getByText("2 / 3")));
    await page.locator('[class*="_mistake_"]').first().click();
    check("разбор вопроса с галочками: правильный помечен", await visible(optionButton("B1").getByText("Правильный ответ")));
    check(
      "разбор: без «Пропущен» и вердикта",
      !(await visible(page.getByText("Пропущен"), 500)) && !(await visible(page.getByText(/^Ответ (не )?засчитан/), 500)),
    );
    await context.close();
  });
}
