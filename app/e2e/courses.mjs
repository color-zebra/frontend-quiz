// Приложение вокруг курсов: первый запуск в «Курсах», запоминание раздела, «Все курсы» (серия, фильтры по значкам,
// устная тренировка к курсу), курс до скачивания (значки с объяснением, оглавление, «нет интернета»), «Начать курс»,
// страница курса и «Продолжить», свой курс по ссылке с пометкой «свой», пройденный курс и «Повторить ошибки»,
// скачанные курсы в кабинете с удалением. Курсы каталога — из custom-sets/, как их отдал бы GitHub.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { load } from "js-yaml";
import { ROOT_DIR } from "./lib.mjs";

const OWN_URL = "https://raw.githubusercontent.com/test/own/main/own.yaml";
const OWN = `title: Мой курс
lessons:
  - id: own-a
    title: Свой урок один
    questions: [own-q1]
    body: Текст первого урока.
  - id: own-b
    title: Свой урок два
    questions: [own-q2]
    body: Текст второго урока.
questions:
  - id: own-q1
    topic: Своё
    subtopic: Раздел
    level: junior
    question: Свой вопрос один
    options:
      - text: 'Да'
        correct: true
        why: 'Так и есть.'
      - text: 'Нет'
        why: 'Не так.'
  - id: own-q2
    topic: Своё
    subtopic: Раздел
    level: junior
    question: Свой вопрос два
    options:
      - text: 'Да'
        correct: true
        why: 'Так и есть.'
      - text: 'Нет'
        why: 'Не так.'
`;

export default async function courses(t) {
  const { check, visible } = t;
  const setsDir = join(ROOT_DIR, "custom-sets");
  const courseCount = load(readFileSync(join(setsDir, "catalog.yaml"), "utf8")).filter(({ url }) => {
    const file = url.split("/custom-sets/")[1];
    return file && existsSync(join(setsDir, file)) && load(readFileSync(join(setsDir, file), "utf8")).lessons?.length;
  }).length;

  let offline = false;
  // section: null — как при самом первом запуске: раздел не задан, приложение его запоминает само.
  const context = await t.newContext({ serviceWorkers: "block", section: null });
  await context.route("https://raw.githubusercontent.com/**", (route) => {
    if (offline) return route.abort("internetdisconnected");
    const { pathname } = new URL(route.request().url());
    if (pathname.endsWith("/own.yaml")) return route.fulfill({ status: 200, contentType: "text/plain; charset=utf-8", body: OWN });
    const file = pathname.split("/custom-sets/")[1];
    const path = file && join(setsDir, file);
    if (!path || !existsSync(path)) return route.fulfill({ status: 404, body: "404: Not Found" });
    return route.fulfill({ status: 200, contentType: "text/plain; charset=utf-8", body: readFileSync(path, "utf8") });
  });
  await context.route("https://color-zebra.github.io/frontend-quiz-audio/**", (route) => route.abort());
  const page = await context.newPage();
  const heading = (name) => page.getByRole("heading", { name, exact: true });
  const button = (name, options = {}) => page.getByRole("button", { name, ...options });
  const seed = (db, store, key, value) =>
    page.evaluate(
      ([db, store, key, value]) =>
        new Promise((resolve, reject) => {
          const open = indexedDB.open(db);
          open.onsuccess = () => {
            const tx = open.result.transaction(store, "readwrite");
            tx.objectStore(store).put(value, key);
            tx.oncomplete = () => resolve(undefined);
            tx.onerror = () => reject(tx.error);
          };
        }),
      [db, store, key, value],
    );
  const findSetId = (title) =>
    page.evaluate(
      (title) =>
        new Promise((resolve) => {
          const open = indexedDB.open("frontend-quiz-sets");
          open.onsuccess = () => {
            const request = open.result.transaction("sets").objectStore("sets").getAll();
            request.onsuccess = () => resolve(request.result.find((r) => r.title === title)?.id);
          };
        }),
      title,
    );

  // Первый запуск — «Курсы»: подсказка новичку и курсы каталога.
  await page.goto(t.url);
  check("первый запуск — раздел «Курсы»", await visible(heading("Курсы")));
  check("в переключателе выбран «Курсы»", (await button("Курсы").getAttribute("aria-current")) === "page");
  check("подсказка новичку «Впервые здесь?»", await visible(page.getByText("Впервые здесь?")));
  check(`«Все курсы · ${courseCount}» и первые курсы списком`, (await visible(page.getByText(`Все курсы · ${courseCount}`))) && (await visible(button(/^WebSocket/))));
  await t.shot(page, "first-run", true);

  // Раздел запоминается до следующего запуска.
  await button("Тренажёр").click();
  check("переключатель открывает «Тренажёр»", await visible(page.getByRole("heading", { name: "Тренажёр" })));
  await page.reload();
  check("после перезапуска — тот же раздел", await visible(page.getByRole("heading", { name: "Тренажёр" })));
  await button("Курсы").click();
  await heading("Курсы").waitFor();

  // Все курсы: серия по номерам, устная тренировка при курсе 7, фильтры по значкам.
  await button("Смотреть все").click();
  await heading("Все курсы").waitFor();
  const series = page.getByRole("region", { name: /^Серия/ });
  const single = page.getByRole("region", { name: "Отдельные курсы" });
  check("серия системного дизайна — семь курсов по номерам", (await series.locator("ol > li").count()) === 7);
  check("устной тренировки в «Всех курсах» нет — она на странице курса 7", !(await visible(page.getByText(/Устная тренировка/), 500)));
  await t.shot(page, "all", true);
  await button("Озвучены").click();
  check(
    "фильтр «Озвучены» — только озвученные курсы",
    (await series.locator("ol > li").count()) === 2 && !(await single.isVisible()),
    `${await series.locator("ol > li").count()}`,
  );
  await button("За компьютером").click();
  check(
    "фильтр «За компьютером» — «Браузер изнутри»",
    (await visible(single.getByRole("button", { name: /^Браузер изнутри/ }))) && (await single.locator("li").count()) === 1 && !(await series.isVisible()),
  );
  await button("Все", { exact: true }).click();

  // Курс до скачивания: значок с объяснением, размер, оглавление; без сети — понятная ошибка.
  await button(/^Браузер изнутри/).click();
  await heading("Браузер изнутри").waitFor();
  check("до скачивания: значок «Практика за компьютером» с объяснением", (await visible(page.getByText("Практика за компьютером"))) && (await visible(page.getByText(/В 11 уроках из 13 есть задания/))));
  check("до скачивания: сколько скачается", await visible(page.getByText(/Курс скачается на устройство \(около \d+ КБ текста\)/)));
  check("до скачивания: оглавление из 13 уроков", (await page.locator("main ol > li").count()) === 13);
  await t.shot(page, "preview", true);
  offline = true;
  await button("Начать курс").click();
  check("нет сети — «похоже, нет интернета», курс не скачан", await visible(page.getByText(/^Не удалось скачать курс — похоже, нет интернета/)));
  offline = false;
  await button("Начать курс").click();
  check("«Начать курс» скачивает и открывает первый урок", await visible(page.getByRole("heading", { level: 1, name: "Почему «тормозит» — не диагноз" })));

  // Страница курса: прогресс, «Дальше», уроки с практикой, вопросы курса.
  await button("Назад").click();
  await page.getByRole("heading", { level: 1, name: "Браузер изнутри" }).waitFor();
  check("страница курса: «Уроки освоены» и «Урок 1 · …» в «Дальше»", (await visible(page.getByText("Уроки освоены"))) && (await visible(page.getByRole("heading", { name: /^Урок 1 · Почему/ }))));
  check("у 11 уроков — «за компьютером»", (await page.getByText("· за компьютером").count()) === 11);
  await t.shot(page, "course", true);
  await button(/^Вопросы курса/).click();
  check("«Вопросы курса» — тренировка по вопросам набора", await visible(page.getByRole("button", { name: /^Начать · / })));
  await button("Назад").click();
  await button("Назад").click();
  await button("Назад").click();
  await heading("Курсы").waitFor();
  const resume = page.getByRole("region", { name: "Продолжить" });
  check("в «Курсах» — «Продолжить» с курсом и «Читать урок»", (await visible(resume.getByText("Браузер изнутри"))) && (await visible(resume.getByRole("button", { name: "Читать урок" }))));
  await t.shot(page, "continue", true);

  // Курс 7: место в серии и устная тренировка с его страницы.
  await button(/^Все курсы/).click();
  await series.getByRole("button", { name: /^7 Практика/ }).click();
  await button("Начать курс").click();
  await page.getByRole("heading", { level: 1 }).first().waitFor();
  await button("Назад").click();
  check("у курса серии — «Системный дизайн фронтенда · курс 7 из 7»", await visible(page.getByText("Системный дизайн фронтенда · курс 7 из 7")));
  await button(/^Устная тренировка к курсу/).click();
  check("устная тренировка скачивается и открывается", await visible(page.getByText(/^Устные вопросы · 12 вопросов/), 8000));

  // Свой набор с уроками по ссылке — курс с пометкой «свой».
  await page.goto(t.url);
  await button("Тренажёр").click();
  await button(/Свои наборы/).click();
  await page.getByRole("textbox", { name: "Ссылка на YAML-файл" }).fill(OWN_URL);
  await button("Добавить", { exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Добавлен" }).waitFor();
  await page.goto(t.url);
  await button("Курсы").click();
  const own = button(/^Мой курс/);
  check("свой курс — в «Моих курсах» с пометкой «свой»", await visible(own.getByText("свой", { exact: true })));

  // Пройденный курс с ошибкой: «Пройден» в списке, «Повторить ошибки» на странице курса.
  const ownId = await findSetId("Мой курс");
  const now = Date.now();
  await seed("frontend-quiz-lessons", "progress", ownId, { setId: ownId, position: null, read: { "own-a": now, "own-b": now }, updatedAt: now });
  await seed("frontend-quiz-progress", "answers", `seed-own-${now}`, { setId: ownId, questionId: "own-q1", at: now, correct: false });
  await page.reload();
  await heading("Курсы").waitFor();
  check("пройденный курс в «Моих курсах» — «Пройден» и ошибки", (await visible(own.getByText("Пройден"))) && (await visible(own.getByText(/1 ошибка ждёт повтора/))));
  await own.click();
  await button("Повторить ошибки · 1").click();
  check("«Повторить ошибки» — сессия по ошибкам курса", await visible(page.getByText("1 / 1")));
  await page.goto(t.url);

  // Кабинет: скачанные курсы и удаление.
  await button("Кабинет").click();
  check("в кабинете — «Скачанные курсы · 3 курса · размер»", await visible(page.getByText(/^Скачанные курсы · 3 курса · /)));
  await t.shot(page, "cabinet", true);
  await button("Удалить «Мой курс»").click();
  await page.getByRole("dialog").getByRole("button", { name: "Удалить" }).click();
  check("курс удалён из кабинета", await visible(page.getByText(/^Скачанные курсы · 2 курса · /)));
  await button("Курсы").click();
  check("и из «Моих курсов»", !(await visible(button(/^Мой курс/), 800)));

  // «скачан» и прогресс — независимые пометки: удалённый с телефона курс хранит прогресс и продолжается с места.
  await button(/^Все курсы/).click();
  const browserCard = single.getByRole("button", { name: /^Браузер изнутри/ });
  check("скачанный курс в «Всех курсах» — «скачан» и прогресс", (await visible(browserCard.getByText("скачан", { exact: true }))) && (await visible(browserCard.getByText("урок 1 из 13"))));
  await t.shot(page, "marks", true);
  await page.goto(t.url);
  await button("Кабинет").click();
  await button("Удалить «Браузер изнутри»").click();
  await page.getByRole("dialog").getByRole("button", { name: "Удалить" }).click();
  await button("Курсы").click();
  await button(/^Все курсы/).click();
  check(
    "удалённый курс — без «скачан», но с прогрессом",
    !(await browserCard.getByText("скачан", { exact: true }).isVisible()) && (await visible(browserCard.getByText("урок 1 из 13"))),
  );
  await t.shot(page, "marks-deleted", true);
  await browserCard.click();
  await t.shot(page, "preview-resume");
  check("до скачивания — где остановился", await visible(page.getByText("Ты остановился на уроке 1 из 13 — курс продолжится с него.")));
  await button("Скачать и продолжить").click();
  check("скачался и открыл урок, на котором остановился", await visible(page.getByRole("heading", { level: 1, name: "Почему «тормозит» — не диагноз" })));

  await context.close();
}
