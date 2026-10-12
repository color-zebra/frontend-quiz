// Поведение экрана: жест «потянуть — обновить» выключен, страница под шторкой не прокручивается,
// итог ответа виден в нижней панели, выбранный вариант после ответа остаётся под пальцем.
import { option, question, withBank } from "./fixtures.mjs";

const LONG = " Длинное пояснение, которое после ответа раздвигает список вариантов.".repeat(4);
const longOption = (text, correct = false) => ({ ...option(text, correct), why: `Пояснение к ${text}.${LONG}` });
const fourOptions = (prefix) => [longOption(`${prefix}1`, true), longOption(`${prefix}2`), longOption(`${prefix}3`), longOption(`${prefix}4`)];

export default async function screen(t) {
  const { check, visible } = t;
  const context = await t.newContext({ serviceWorkers: "block" });
  const page = await context.newPage();
  const scrollY = () => page.evaluate(() => window.scrollY);
  await page.goto(t.url);
  await page.getByText("Что тренируем?").waitFor();

  // 1. Жест обновления: сам жест есть только на телефоне — здесь проверяем, что правило стоит.
  const overscroll = await page.evaluate(() =>
    [document.documentElement, document.body].map((el) => getComputedStyle(el).overscrollBehaviorY),
  );
  check("жест «потянуть — обновить» выключен", overscroll.every((v) => v === "contain"), overscroll.join(", "));
  t.info("сам жест на телефоне проверяется руками после деплоя");

  // Сжиматель стилей однажды выбросил обычное свойство размытия, оставив -webkit-, — и в Chrome стекло стало прозрачным.
  const blur = await page.getByRole("button", { name: /Мои наборы/ }).evaluate((el) => getComputedStyle(el).backdropFilter);
  check("стекло в собранном приложении размывает фон", blur.includes("blur"), blur);

  // 2. Шторка подтем: страница под ней стоит.
  await page.getByRole("button", { name: /Подтемы/ }).click();
  await page.getByRole("dialog").waitFor();
  await page.mouse.move(195, 80);
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(400);
  check("при открытой шторке страница не прокручивается", (await scrollY()) === 0, `прокрутка ${await scrollY()}`);
  await page.keyboard.press("Escape");
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(400);
  // Без этой проверки первая засчиталась бы и на странице, которая не крутится вообще.
  check("после закрытия шторки страница снова прокручивается", (await scrollY()) > 0, `прокрутка ${await scrollY()}`);
  await context.close();

  // 3. Итог ответа и выбранный вариант под пальцем.
  const questions = [
    question("s-anchor", "ANCHOR: какой верен?", fourOptions("A")),
    question("s-wrong", "WRONG: какой верен?", fourOptions("W")),
    question("s-giveup", "GIVEUP: какой верен?", fourOptions("G")),
    question("s-multi", "MULTI: какие верны?", [longOption("M1", true), longOption("M2"), longOption("M3", true), longOption("M4")]),
  ];
  await withBank({ questions }, async () => {
    const ctx = await t.newContext({ serviceWorkers: "block" });
    const p = await ctx.newPage();
    await p.goto(t.url);
    await p.getByText("Что тренируем?").waitFor();
    await p.getByRole("button", { name: "10", exact: true }).click();
    await p.getByRole("button", { name: /^Начать/ }).click();

    const options = p.locator("ol li button");
    const texts = () => options.evaluateAll((els) => els.map((el) => el.innerText.replace(/^\d\s*/, "").trim()));
    const positionOf = async (prefix) => (await texts()).findIndex((x) => x.startsWith(prefix)) + 1;
    const next = p.getByRole("button", { name: /^(Дальше|Завершить)$/ });
    /** Итог слева от «Дальше»: виден на экране, начинается с head, ниже — номер правильного (или ничего при «Верно»). */
    const verdictInView = async (head, sub) => {
      const verdict = p.getByRole("status").filter({ hasText: new RegExp(`^${head}`) });
      if (!(await visible(verdict))) return false;
      const box = await verdict.boundingBox();
      const inView = box.y >= 0 && box.y + box.height <= 844;
      const lines = (await verdict.innerText()).trim();
      return inView && (sub ? lines.endsWith(sub) : lines === head);
    };
    /** Кнопка справа до ответа и «Дальше» после — одного размера и на одном месте. */
    const sameBox = (a, b) => Math.abs(a.x - b.x) < 1 && Math.abs(a.width - b.width) < 1 && Math.abs(a.y - b.y) < 1;

    for (let i = 1; i <= 4; i++) {
      await p.getByText(`${i} / 4`).waitFor();
      const text = await p.locator("article").first().innerText();
      if (text.includes("ANCHOR")) {
        const last = options.last();
        const lastText = (await texts()).at(-1);
        const before = (await last.boundingBox()).y;
        await last.click();
        const after = (await last.boundingBox()).y;
        check("выбранный вариант после ответа остался под пальцем", Math.abs(after - before) < 2, `${before} → ${after}`);
        // Иначе проверка выше засчиталась бы и там, где пояснения ничего не сдвинули.
        check("и для этого страница подкрутилась", (await p.evaluate(() => window.scrollY)) > 0);
        const ok = lastText.startsWith("A1");
        const sub = ok ? undefined : `верный: ${await positionOf("A1")}`;
        check(`итог слева от «Дальше» виден на экране: «${ok ? "Верно" : `Неверно, ${sub}`}»`, await verdictInView(ok ? "Верно" : "Неверно", sub));
        await t.shot(p, "anchor");
      } else if (text.includes("WRONG")) {
        check("до ответа слева — заглушка «Выбери вариант»", await visible(p.getByText("Выбери вариант", { exact: true })));
        const giveUpBox = await p.getByRole("button", { name: "Не знаю" }).boundingBox();
        await t.shot(p, "before-answer");
        const wrong = (await texts()).findIndex((x) => !x.startsWith("W1"));
        await options.nth(wrong).click();
        check("ошибка — «Неверно» с номером правильного", await verdictInView("Неверно", `верный: ${await positionOf("W1")}`));
        check("«Дальше» на месте «Не знаю» и того же размера", sameBox(giveUpBox, await next.boundingBox()));
        await t.shot(p, "wrong");
      } else if (text.includes("GIVEUP")) {
        await p.getByRole("button", { name: "Не знаю" }).click();
        check("«Не знаю» — с номером правильного", await verdictInView("Не знаю", `верный: ${await positionOf("G1")}`));
      } else {
        await options.nth((await positionOf("M1")) - 1).click();
        await options.nth((await positionOf("M3")) - 1).click();
        const submit = p.getByRole("button", { name: "Ответить" });
        const submitBox = await submit.boundingBox();
        await submit.click();
        check("вопрос с галочками — «Верно»", await verdictInView("Верно"));
        check("«Дальше» на месте «Ответить» и того же размера", sameBox(submitBox, await next.boundingBox()));
        await t.shot(p, "multi");
      }
      await next.click();
    }
    await ctx.close();
  });

  // Самый узкий экран, который поддерживаем (живые телефоны — от 360), и самый длинный итог: 5 верных из 6.
  const five = ["V1", "V2", "V3", "V4", "V5"].map((text) => longOption(text, true)).concat(longOption("V6"));
  await withBank({ questions: [question("s-five", "FIVE: какие верны?", five)] }, async () => {
    const ctx = await t.newContext({ serviceWorkers: "block", viewport: { width: 330, height: 640 } });
    const p = await ctx.newPage();
    await p.goto(t.url);
    await p.getByText("Что тренируем?").waitFor();
    check("330px: главная не вылезает вбок", (await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) === 0);
    await p.getByRole("button", { name: /^Начать/ }).click();
    const options = p.locator("ol li button");
    const texts = await options.evaluateAll((els) => els.map((el) => el.innerText.replace(/^\d\s*/, "").trim()));
    await options.nth(texts.findIndex((x) => x.startsWith("V6"))).click();
    await p.getByRole("button", { name: "Ответить" }).click();
    const numbers = texts.flatMap((x, i) => (x.startsWith("V6") ? [] : [i + 1])).join(", ");
    const line = p.getByRole("status").filter({ hasText: /^Неверно/ }).locator("span");
    // Строка с номерами обрезается многоточием, если не влезает: тогда scrollWidth больше видимой ширины.
    const fits = await line.evaluate((el) => el.scrollWidth <= el.clientWidth);
    check("330px: все пять номеров верных ответов видны целиком", fits && (await line.innerText()) === `верные: ${numbers}`, await line.innerText());
    check("330px: вопрос не вылезает вбок", (await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) === 0);
    await t.shot(p, "330-five");
    await ctx.close();
  });
}
