// Перенос строк в коде, «Не знаю», заметка только по кнопке, отчёт о пропущенных вопросах набора.
import { fileInput, option, question, withBank } from "./fixtures.mjs";

const LONG_LINE = `const result = someFunction(firstArgument, secondArgument, thirdArgument, fourthArgument, fifthArgument);`;

export default async function features(t) {
  const { check, visible } = t;
  const questions = [
    question("f-1", "Первый вопрос", [option("Да", true), option("Нет"), option("Может быть"), option("Никогда")], {
      code: LONG_LINE,
      codeLang: "js",
    }),
    question("f-2", "Второй вопрос", [option("Один", true), option("Два"), option("Три"), option("Четыре")]),
  ];

  await withBank({ questions }, async () => {
    const context = await t.newContext({ serviceWorkers: "block" });
    const page = await context.newPage();
    await page.goto(t.url);
    await page.getByText("Что тренируем?").waitFor();
    await page.getByRole("button", { name: "10", exact: true }).click();
    await page.getByRole("button", { name: "Начать · 2 вопроса" }).click();
    await page.getByText(/^\d \/ 2$/).waitFor();

    // Перенос строк: выключен по умолчанию, переключается кнопкой и запоминается.
    const firstIsCode = await page.locator("pre").count();
    if (!firstIsCode) {
      await page.keyboard.press("0");
      await page.getByRole("button", { name: "Дальше" }).click();
    }
    const pre = page.locator("pre").first();
    const whiteSpace = () => pre.evaluate((el) => getComputedStyle(el).whiteSpace);
    check("перенос строк по умолчанию выключен", (await whiteSpace()) === "pre");
    await page.getByRole("button", { name: "Переносить длинные строки" }).click();
    check("кнопка включает перенос", (await whiteSpace()) === "pre-wrap");
    check("выбор запомнен на устройстве", (await page.evaluate(() => localStorage.getItem("fq.codeWrap"))) === "1");
    await t.shot(page, "wrap");

    // Заметка: только по кнопке, кнопка подсвечивается.
    await page.getByRole("button", { name: "Заметка", exact: true }).click();
    await page.getByRole("textbox").fill("Мнемоника: ответ — да");
    await page.getByRole("button", { name: "Сохранить" }).click();
    check("после сохранения кнопка — «Изменить заметку»", await visible(page.getByRole("button", { name: "Изменить заметку" })));
    check("текст заметки на экране не виден", !(await page.getByText("Мнемоника: ответ — да").isVisible()));
    await page.getByRole("button", { name: "Изменить заметку" }).click();
    check("по кнопке заметка открывается для чтения и правки", (await page.getByRole("textbox").inputValue()) === "Мнемоника: ответ — да");
    await page.keyboard.press("Escape");

    // «Не знаю» кнопкой.
    await page.getByRole("button", { name: "Не знаю" }).click();
    check("«Не знаю» показывает разбор", await visible(page.getByText("Ответ показан — вопрос попадёт в «Прорешать ошибки»")));
    check("«Не знаю» отмечает правильный ответ", await visible(page.getByText("Правильный ответ")));
    check("заметка не появилась и после ответа", !(await page.getByText("Мнемоника: ответ — да").isVisible()));
    await page.getByRole("button", { name: /^(Дальше|Завершить)$/ }).click();

    // «Не знаю» клавишей 0 (если вопрос ещё остался).
    if (await page.getByRole("button", { name: "Не знаю" }).isVisible()) {
      await page.keyboard.press("0");
      check("клавиша 0 — «Не знаю»", await visible(page.getByText("Ответ показан — вопрос попадёт в «Прорешать ошибки»")));
      await page.getByRole("button", { name: "Завершить" }).click();
    }
    check("«Не знаю» засчитывается как ошибка", await visible(page.getByText(/^Ошибки · [12]$/)));
    await context.close();
  });

  // Отчёт «Что пропущено» при загрузке набора.
  const context = await t.newContext({ serviceWorkers: "block" });
  const page = await context.newPage();
  await page.goto(t.url);
  await page.getByText("Что тренируем?").waitFor();
  await page.getByRole("button", { name: /Мои наборы/ }).click();
  const yaml = `title: С ошибками
questions:
  - id: ok-1
    level: junior
    question: Нормальный
    options:
      - text: да
        correct: true
      - text: нет
  - id: bad-1
    level: junior
    question: Без правильного
    options:
      - text: a
      - text: b
  - id: bad-2
    level: easy
    question: Странный уровень
    options:
      - text: a
        correct: true
      - text: b
  - id: ok-1
    level: junior
    question: Повтор
    options:
      - text: a
        correct: true
      - text: b
`;
  await page.locator('input[type="file"]').setInputFiles(fileInput("errors.yaml", yaml));
  check("сообщение говорит, что причины ниже", await visible(page.getByText("Добавлен «С ошибками»: 1 вопрос. Пропущено 3 — причины ниже.")));
  await page.getByText("Что пропущено").click();
  check("причина: нет правильного варианта", await visible(page.getByText("bad-1: ни у одного варианта нет correct: true")));
  check("причина: непонятный уровень", await visible(page.getByText(/^bad-2: непонятный уровень «easy»/)));
  check("причина: повтор id", await visible(page.getByText("ok-1: такой id уже был выше в файле")));
  await t.shot(page, "skipped");
  await context.close();
}
