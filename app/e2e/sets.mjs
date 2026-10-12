// Свои наборы по ссылке: добавление, ошибки, чужие хосты, тренировка, заметки, обновление, удаление.
// Проверка «сайт без CORS» ходит на настоящий GitLab — нужен интернет.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT_DIR, readConfig } from "./lib.mjs";

// В config.ts ссылка на пример собрана из REPO_URL тем же способом.
const SAMPLE_SET_URL = `${readConfig("REPO_URL")}/blob/main/examples/sample-set.yaml`;

export default async function sets(t) {
  const { check, visible } = t;
  let sampleYaml = readFileSync(join(ROOT_DIR, "examples", "sample-set.yaml"), "utf8");
  const closuresYaml = readFileSync(join(ROOT_DIR, "questions", "javascript", "closures.yaml"), "utf8");
  const closuresCount = (closuresYaml.match(/^\s+- id:/gm) ?? []).length;
  const samplePath = new URL(SAMPLE_SET_URL).pathname.replace("/blob/", "/");
  const repoPath = samplePath.replace(/\/examples\/sample-set\.yaml$/, "");
  const partialYaml = `title: Частичный
questions:
  - id: p-1
    level: junior
    question: Нормальный вопрос
    options:
      - text: да
        correct: true
      - text: нет
  - id: p-2
    level: junior
    question: Без правильного варианта
    options:
      - text: a
      - text: b
`;
  const files = {
    [samplePath]: () => sampleYaml,
    [`${repoPath}/questions/javascript/closures.yaml`]: () => closuresYaml,
    "/x/y/main/broken.yaml": () => "questions: [ {",
    "/x/y/main/partial.yaml": () => partialYaml,
  };
  const otherYaml = "title: Чужой хост\nquestions:\n  - id: o-1\n    level: junior\n    question: Вопрос\n    options:\n      - text: да\n        correct: true\n      - text: нет\n";

  // Service Worker выключен: иначе запросы шли бы мимо перехвата Playwright.
  const context = await t.newContext({ serviceWorkers: "block" });
  await context.route("https://raw.githubusercontent.com/**", (route) => {
    const file = files[new URL(route.request().url()).pathname];
    if (!file) return route.fulfill({ status: 404, body: "404: Not Found" });
    return route.fulfill({ status: 200, contentType: "text/plain; charset=utf-8", body: file() });
  });
  // Playwright подставляет ответы в обход CORS, поэтому «сайт без CORS» ниже — живой GitLab.
  await context.route("https://files.example.test/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/yaml", headers: { "Access-Control-Allow-Origin": "*" }, body: otherYaml }),
  );
  await context.route("https://html.example.test/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      headers: { "Access-Control-Allow-Origin": "*" },
      body: "<!doctype html><title>file page</title>",
    }),
  );
  const page = await context.newPage();
  await page.goto(t.url);
  await page.getByText("Что тренируем?").waitFor();

  await page.getByRole("button", { name: /Мои наборы/ }).click();
  check("экран наборов открылся", await visible(page.getByRole("heading", { name: "Мои наборы" })));
  check("пустой список", await visible(page.getByText("Наборов пока нет.")));

  const input = page.getByRole("textbox", { name: "Ссылка на YAML-файл" });
  const add = async (link) => {
    await input.fill(link);
    await page.getByRole("button", { name: "Добавить", exact: true }).click();
  };

  await page.getByRole("button", { name: "Подставить ссылку на пример" }).click();
  check("пример подставляется в поле", (await input.inputValue()) === SAMPLE_SET_URL);
  await page.getByRole("button", { name: "Добавить", exact: true }).click();
  check("пример добавлен: 6 вопросов", await visible(page.getByText("Добавлен «Пример набора — сложность и Git»: 6 вопросов.")));
  check("поле очистилось", (await input.inputValue()) === "");

  await add(SAMPLE_SET_URL);
  check("повторное добавление — «уже добавлен»", await visible(page.getByText("Этот набор уже добавлен: «Пример набора — сложность и Git»")));
  await add("https://files.example.test/sets/other.yaml");
  check("чужой сайт с разрешением CORS — набор добавлен", await visible(page.getByText("Добавлен «Чужой хост»: 1 вопрос.")));
  check("источник чужого сайта подписан «сайт › файл»", await visible(page.getByText("files.example.test › other.yaml")));
  await add("https://gitlab.com/gitlab-org/gitlab-foss/-/raw/master/README.md");
  check("сайт без CORS (GitLab) — понятная ошибка", await visible(page.getByText(/^Не удалось скачать файл/), 15000));
  await add("https://html.example.test/page");
  check("страница вместо файла — подсказка про Raw", await visible(page.getByText(/^По ссылке пришла веб-страница/)));
  await add("http://files.example.test/set.yaml");
  check("http:// — нужна https", await visible(page.getByText(/^Нужна ссылка с https:\/\//)));
  await page.getByRole("button", { name: "Удалить «Чужой хост»" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Удалить" }).click();
  await add("https://github.com/x/y");
  check("ссылка на репозиторий, а не на файл", await visible(page.getByText(/^Нужна ссылка на сам файл/)));
  await add("просто текст");
  check("не ссылка", await visible(page.getByText("Это не похоже на ссылку")));
  await add("https://github.com/x/y/blob/main/broken.yaml");
  check("битый YAML", await visible(page.getByText("Не удалось разобрать набор: файл не читается как YAML")));
  await add("https://github.com/x/y/blob/main/missing.yaml");
  check("нет файла — 404", await visible(page.getByText(/^Файл не найден/)));
  await add("https://raw.githubusercontent.com/x/y/main/partial.yaml");
  check("кривые вопросы пропущены", await visible(page.getByText("Добавлен «Частичный»: 1 вопрос. Пропущено 1 — причины ниже.")));
  await add(`https://github.com${repoPath.replace(/^(\/[^/]+\/[^/]+)\//, "$1/blob/")}/questions/javascript/closures.yaml`);
  check(
    "файл подтемы из основной базы — тоже набор",
    await visible(page.getByText(new RegExp(`^Добавлен «closures»: ${closuresCount} вопрос`))),
    `${closuresCount} вопросов`,
  );
  await t.shot(page, "list", true);

  // Тренировка по примеру.
  await page.getByRole("button", { name: /Пример набора — сложность и Git/ }).first().click();
  check("экран набора: заголовок", await visible(page.getByRole("heading", { name: "Пример набора — сложность и Git" })));
  check(
    "темы набора из поля topic",
    (await visible(page.getByRole("button", { name: /Сложность алгоритмов/ }))) && (await visible(page.getByRole("button", { name: /^Git/ }))),
  );
  await page.getByRole("button", { name: "10", exact: true }).click();
  await page.getByRole("button", { name: "Начать · 6 вопросов" }).click();
  for (let i = 1; i <= 6; i++) {
    await page.getByText(`${i} / 6`).waitFor();
    if (i === 1) {
      await page.getByRole("button", { name: "Заметка", exact: true }).click();
      await page.getByRole("textbox").fill("Заметка к набору");
      await page.getByRole("button", { name: "Сохранить" }).click();
    }
    await page.keyboard.press("1");
    if (await page.getByRole("button", { name: "Ответить" }).isVisible()) await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
  }
  check("сессия по набору дошла до итога", await visible(page.getByText("Отвечено 6 вопросов")));
  await page.getByRole("button", { name: "К набору" }).click();
  check("«К набору» возвращает к набору", await visible(page.getByRole("heading", { name: "Пример набора — сложность и Git" })));

  // Обновление: удаляем последний вопрос, добавляем новый.
  sampleYaml =
    sampleYaml.replace(/\n {2}- id: complexity-003[\s\S]*$/, "\n") +
    "  - id: extra-001\n    level: junior\n    question: Новый вопрос\n    options:\n      - text: да\n        correct: true\n      - text: нет\n";
  await page.getByRole("button", { name: "Обновить набор" }).click();
  check("обновление набора: сводка", await visible(page.getByText("Набор обновлён: новых 1, удалено 1.")));
  await page.getByRole("button", { name: "Назад" }).click();

  // Удаление.
  await page.getByRole("button", { name: "Удалить «Частичный»" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Удалить" }).click();
  check("набор удалён из списка", !(await visible(page.getByRole("button", { name: /^Частичный/ }), 1000)));
  await page.getByRole("button", { name: "Удалить «Пример набора — сложность и Git»" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Удалить" }).click();

  // Заметки к удалённому набору.
  await page.getByRole("button", { name: "Назад" }).click();
  await page.getByRole("button", { name: /Мои заметки/ }).click();
  check("заметка помнит набор после его удаления", await visible(page.getByText("Набор «Пример набора — сложность и Git»")));
  check("заметка помечена «Набор удалён»", await visible(page.getByText("Набор удалён")));

  await page.reload();
  await page.getByText("Что тренируем?").waitFor();
  check("после перезагрузки на главной 1 набор", await visible(page.getByText("1 набор")));
  await context.close();
}
