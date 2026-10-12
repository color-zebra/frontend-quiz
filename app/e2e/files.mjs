// Наборы из файла с устройства: добавление, обновление тем же именем, ошибки, работа без сети.
import { fileInput } from "./fixtures.mjs";

const question = (id, text) =>
  `  - id: ${id}\n    level: junior\n    question: ${text}\n    options:\n      - text: да\n        correct: true\n      - text: нет\n`;
const V1 = `title: Мой локальный\nquestions:\n${question("a", "Первый")}${question("b", "Второй")}`;
const V2 = `title: Мой локальный\nquestions:\n${question("a", "Первый")}${question("b", "Второй")}${question("c", "Третий")}`;

export default async function files(t) {
  const { check, visible } = t;
  const context = await t.newContext({ serviceWorkers: "block" });
  const page = await context.newPage();
  await page.goto(t.url);
  await page.getByText("Что тренируем?").waitFor();
  await page.getByRole("button", { name: /Мои наборы/ }).click();
  const input = page.locator('input[type="file"]');

  check("кнопка «Загрузить файл с устройства»", await visible(page.getByRole("button", { name: "Загрузить файл с устройства" })));
  await context.setOffline(true);
  await input.setInputFiles(fileInput("my-set.yaml", V1));
  check("файл добавляется, в том числе без сети", await visible(page.getByText("Добавлен «Мой локальный»: 2 вопроса.")));
  check("источник — «Файл с устройства»", await visible(page.getByText("Файл с устройства · my-set.yaml")));
  check("у набора из файла нет кнопки обновления", !(await visible(page.getByRole("button", { name: "Обновить «Мой локальный»" }), 800)));

  await input.setInputFiles(fileInput("my-set.yaml", V2));
  check("тот же файл повторно — обновление", await visible(page.getByText("Набор «Мой локальный» обновлён: новых 1.")));
  check("набор не задвоился", (await page.getByText("Файл с устройства · my-set.yaml").count()) === 1);
  await input.setInputFiles(fileInput("my-set.yaml", V2));
  check("без изменений — «не изменился»", await visible(page.getByText("Набор «Мой локальный» не изменился.")));

  await input.setInputFiles(fileInput("other.yml", V1));
  check("другое имя — отдельный набор", await visible(page.getByText("Файл с устройства · other.yml")));
  await input.setInputFiles(fileInput("broken.yaml", "questions: [ {"));
  check("битый YAML — понятная ошибка", await visible(page.getByText("Не удалось разобрать набор: файл не читается как YAML")));
  await input.setInputFiles(fileInput("notes.txt", "просто текст"));
  check("текст без вопросов — понятная ошибка", await visible(page.getByText("Не удалось разобрать набор: в файле нет списка questions")));
  await t.shot(page, "list", true);

  await page.getByRole("button", { name: /^Мой локальный/ }).first().click();
  check("экран набора из файла открылся", await visible(page.getByRole("heading", { name: "Мой локальный" })));
  check("на экране набора нет кнопки обновления", !(await visible(page.getByRole("button", { name: "Обновить набор" }), 800)));
  await page.getByRole("button", { name: /^Начать/ }).click();
  check("тренировка по набору из файла без сети", await visible(page.getByText("1 / 3")));
  await context.close();
}
