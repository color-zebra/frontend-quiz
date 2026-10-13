// Кнопка «Не согласен с вопросом»: ссылка на строку вопроса в основной базе, шутки для своих наборов, кнопка на разборе.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileInput, withBank } from "./fixtures.mjs";
import { DIST_DIR, ROOT_DIR, readConfig } from "./lib.mjs";

const setYaml = (title) =>
  `title: ${title}\nquestions:\n  - id: m-1\n    level: junior\n    question: Единственный вопрос\n    options:\n      - text: да\n        correct: true\n      - text: нет\n`;
const COMPLAIN = { name: "Не согласен с вопросом" };

/** Самый длинный кусок текста вопроса без Markdown-разметки — по нему вопрос ищется на экране. */
const getTextFragment = (question) =>
  question.question
    .split(/[`*_\n]/)
    .map((part) => part.trim())
    .sort((a, b) => b.length - a.length)[0]
    .slice(0, 40);

export default async function complaint(t) {
  const { check, visible } = t;
  const repo = readConfig("REPO_URL");
  const base = JSON.parse(readFileSync(join(DIST_DIR, "questions.json"), "utf8"));
  const all = [...base.questions, ...(base.speech ?? [])];
  check("у всех вопросов базы есть номер строки", all.every((q) => Number.isInteger(q.line)));

  const context = await t.newContext({ serviceWorkers: "block" });
  await context.route("https://raw.githubusercontent.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/plain; charset=utf-8", body: setYaml("Набор друга") }),
  );
  await context.route("https://files.example.test/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/yaml", headers: { "Access-Control-Allow-Origin": "*" }, body: setYaml("Набор с сайта") }),
  );
  const page = await context.newPage();
  // Шторка выезжает с анимацией — снимаем, когда она остановится.
  const shotSheet = async (file) => {
    await page.waitForTimeout(900);
    await t.shot(page, file);
  };
  const openSet = async (title) => {
    await page.getByRole("button", { name: new RegExp(`^${title}`) }).first().click();
    await page.getByRole("button", { name: /^Начать/ }).click();
    await page.getByRole("button", COMPLAIN).click();
  };
  await page.goto(t.url);
  await page.getByText("Что тренируем?").waitFor();

  // Основная база: ссылка ведёт на файл и строку текущего вопроса.
  await page.getByRole("button", { name: /^Начать/ }).click();
  await page.getByRole("button", COMPLAIN).click();
  check("шторка «Не согласен?» открылась", await visible(page.getByRole("heading", { name: "Не согласен?" })));
  const href = await page.getByRole("link", { name: "пулл реквесту" }).getAttribute("href");
  const match = href?.match(/^(.+)\/blob\/main\/(questions\/[\w-]+\/[\w-]+\.yaml)#L(\d+)$/);
  check("ссылка — файл базы на GitHub с номером строки", !!match && match[1] === repo, href);
  if (match) {
    const line = readFileSync(join(ROOT_DIR, match[2]), "utf8").split("\n")[Number(match[3]) - 1] ?? "";
    const question = base.questions.find((q) => q.id === line.match(/id:\s*["']?([\w-]+)/)?.[1]);
    check("на этой строке файла — id вопроса", !!question, line.trim());
    const fragment = question ? getTextFragment(question) : "";
    check("и это тот самый вопрос, что на экране", !!fragment && (await visible(page.getByText(fragment).first())), fragment);
  }
  await shotSheet("builtin");
  await page.keyboard.press("Escape");
  check("Esc закрывает шторку", !(await visible(page.getByRole("heading", { name: "Не согласен?" }), 1000)));

  // Номер строки сдвигается от правок соседних вопросов — это не «исправление» вопроса.
  await page.goto(t.url);
  await page.getByText("Что тренируем?").waitFor();
  const shift = (q) => ({ ...q, line: q.line + 3 });
  await withBank({ questions: base.questions.map(shift), speech: (base.speech ?? []).map(shift) }, async () => {
    await page.getByRole("button", { name: "Кабинет" }).click();
    await page.getByRole("button", { name: "Обновить базу" }).click();
    check("сдвиг строк в файлах не считается исправлением", await visible(page.getByText("У тебя самая свежая база.")));
    await page.getByRole("button", { name: "Назад" }).click();
  });

  // Набор с устройства — шутка без ссылки; та же кнопка на разборе ошибки.
  await page.getByRole("button", { name: /Мои наборы/ }).click();
  await page.locator('input[type="file"]').setInputFiles(fileInput("my.yaml", setYaml("Мой набор")));
  await openSet("Мой набор");
  const joke = page.getByText("Так ты сам вопросы составлял, я-то при чём? 🙂");
  check("набор с устройства — «сам составлял»", await visible(joke));
  check("и без ссылки", (await page.getByRole("dialog").getByRole("link").count()) === 0);
  await shotSheet("file");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Не знаю" }).click();
  await page.getByRole("button", { name: "Завершить" }).click();
  await page.locator('[class*="_mistake_"]').first().click();
  check("на разборе ошибки тоже есть кнопка", await visible(page.getByRole("button", COMPLAIN)));
  await page.getByRole("button", COMPLAIN).click();
  check("и шутка та же", await visible(joke));

  // Наборы по ссылке — шутка и ссылка на сам файл, без строки.
  for (const [title, link, expected] of [
    ["Набор друга", "https://github.com/friend/sets/blob/main/react.yaml", "https://github.com/friend/sets/blob/main/react.yaml"],
    ["Набор с сайта", "https://files.example.test/sets/x.yaml", "https://files.example.test/sets/x.yaml"],
  ]) {
    await page.goto(t.url);
    await page.getByRole("button", { name: /Мои наборы/ }).click();
    await page.getByRole("textbox", { name: "Ссылка на YAML-файл" }).fill(link);
    await page.getByRole("button", { name: "Добавить", exact: true }).click();
    await openSet(title);
    check(`${title}: шутка про почтальона`, await visible(page.getByText(/^Я тут просто почтальон/)));
    const fileHref = await page.getByRole("link", { name: "Вот его файл" }).getAttribute("href");
    check(`${title}: ссылка на файл набора`, fileHref === expected, fileHref);
    if (title === "Набор друга") await shotSheet("link");
  }
  await context.close();
}
