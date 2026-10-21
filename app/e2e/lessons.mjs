// Режим обучения: уроки в наборе, оглавление, урок и его разметка, вопросы урока по порядку, «Продолжить обучение»,
// ничего не пишется в ленту ответов и не трогает незаконченную тренировку, сброс курса, резервная копия, обновление.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT_DIR } from "./lib.mjs";
import { fileInput, lessonsSetYaml, openCabinet } from "./fixtures.mjs";

const BASE = "https://raw.githubusercontent.com/test/course/main/";
const SPEECH_YAML = `title: Устный с уроками
kind: speech
lessons:
  - id: s-l
    title: Урок
    body: Текст.
questions:
  - id: s-1
    level: junior
    question: Расскажи
    answer: Эталон
`;

/** Сколько записей в ленте ответов на устройстве. */
function countAnswers(page) {
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const open = indexedDB.open("frontend-quiz-progress");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          if (!db.objectStoreNames.contains("answers")) return resolve(0);
          const request = db.transaction("answers").objectStore("answers").count();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        };
      }),
  );
}

export default async function lessons(t) {
  const { check, visible } = t;
  let courseYaml = lessonsSetYaml();
  const files = {
    "course.yaml": () => courseYaml,
    "plain.yaml": () => readFileSync(join(ROOT_DIR, "examples", "sample-set.yaml"), "utf8"),
    "speech.yaml": () => SPEECH_YAML,
    "sample.yaml": () => readFileSync(join(ROOT_DIR, "examples", "lessons-sample.yaml"), "utf8"),
  };
  const image = readFileSync(join(ROOT_DIR, "examples", "images", "lessons-sample-cache.png"));

  const context = await t.newContext({ serviceWorkers: "block" });
  await context.route(`${BASE}**`, (route) => {
    const name = new URL(route.request().url()).pathname.split("/main/")[1];
    if (name === "images/pic.png" || name === "images/lessons-sample-cache.png") {
      return route.fulfill({ status: 200, contentType: "image/png", headers: { "Access-Control-Allow-Origin": "*" }, body: image });
    }
    const file = files[name];
    if (!file) return route.fulfill({ status: 404, body: "404: Not Found" });
    return route.fulfill({ status: 200, contentType: "text/plain; charset=utf-8", body: file() });
  });
  const page = await context.newPage();
  let chunkRequests = 0;
  page.on("request", (r) => r.url().includes("/assets/lessonScreens-") && r.url().endsWith(".js") && chunkRequests++);

  const lessonTitle = (name) => page.getByRole("heading", { level: 1, name });
  const openSets = async () => {
    await page.getByRole("button", { name: /Мои наборы/ }).click();
    await page.getByRole("heading", { name: "Мои наборы" }).waitFor();
  };
  const addSet = async (name) => {
    await page.getByRole("textbox", { name: "Ссылка на YAML-файл" }).fill(`${BASE}${name}`);
    await page.getByRole("button", { name: "Добавить", exact: true }).click();
    const message = page.getByRole("status").filter({ hasText: "Добавлен" }).first();
    await message.waitFor();
    return message;
  };
  const openSet = async (title) => {
    await page.getByRole("button", { name: new RegExp(`^${title}`) }).first().click();
    await page.getByRole("heading", { level: 1, name: title }).waitFor();
  };
  const answer = async (text) => {
    await page.getByRole("button", { name: new RegExp(text) }).first().click();
  };

  await page.goto(t.url);
  await page.getByText("Что тренируем?").waitFor();

  // Незаконченная тренировка основной базы: режим обучения не должен её трогать.
  await page.getByRole("button", { name: /^Начать/ }).click();
  await page.getByText(/^1 \/ /).waitFor();
  await page.keyboard.press("1");
  // Вопрос с галочками: «1» только отмечает вариант, ответ — по Enter.
  if (await page.getByRole("button", { name: "Ответить" }).isVisible()) await page.keyboard.press("Enter");
  await page.getByRole("button", { name: /^(Дальше|Завершить)/ }).waitFor();
  // Ответ пишется на устройство не мгновенно: перезагрузка раньше записи его бы потеряла.
  await page.waitForFunction(
    () =>
      new Promise((resolve) => {
        const open = indexedDB.open("frontend-quiz-progress");
        open.onsuccess = () => {
          const request = open.result.transaction("answers").objectStore("answers").count();
          request.onsuccess = () => resolve(request.result === 1);
        };
      }),
  );
  await page.reload();
  await page.getByText("Что тренируем?").waitFor();
  const savedSession = await page.evaluate(() => localStorage.getItem("fq.activeSession"));
  const answersBefore = await countAnswers(page);
  check("до обучения: незаконченная тренировка и один ответ в ленте", !!savedSession && answersBefore === 1, `ответов: ${answersBefore}`);
  await page.getByRole("button", { name: "Кабинет" }).click();
  const achievementsBefore = await page.getByRole("button", { name: /^Достижения/ }).innerText();
  await page.getByRole("button", { name: "Назад" }).click();

  // Набор без уроков — экран набора прежний.
  await openSets();
  await addSet("plain.yaml");
  await openSet("Пример набора");
  check("у набора без уроков нет кнопки «Учиться»", !(await page.getByRole("button", { name: /^Учиться/ }).isVisible()));
  check("…а тренировка на месте", await visible(page.getByRole("button", { name: /^Тренировка/ })));
  check("экраны уроков не загружены, пока их не открыли", chunkRequests === 0, `запросов: ${chunkRequests}`);
  await page.getByRole("button", { name: "Назад" }).click();

  // Устный набор: уроки не читаются, автору — замечание.
  const speechMessage = await addSet("speech.yaml");
  await speechMessage.getByText("Что поправить в файле").click();
  check(
    "устный набор: «уроки работают только в тестовых наборах»",
    await visible(speechMessage.getByText(/Уроки работают только в тестовых наборах/)),
  );

  // Пример из examples/ читается без пропусков и замечаний.
  const sampleMessage = await addSet("sample.yaml");
  check(
    "examples/lessons-sample.yaml: 6 вопросов, 2 урока, без пропусков",
    (await sampleMessage.innerText()).startsWith("Добавлен «HTTP-кэш — пример с уроками»: 6 вопросов, 2 урока."),
    await sampleMessage.innerText(),
  );

  // Набор с уроками: отчёт о битых уроках и неизвестном id.
  const courseMessage = await addSet("course.yaml");
  check(
    "сообщение о добавлении называет уроки",
    (await courseMessage.innerText()).startsWith("Добавлен «Курс для проверки»: 3 вопроса, 3 урока. Пропущено 3"),
    await courseMessage.innerText(),
  );
  await courseMessage.getByText("Что пропущено и что поправить").click();
  for (const item of [
    "урок №3: нет id",
    "урок l-notitle: нет названия (title)",
    "урок l-intro: такой id урока уже был выше в файле",
    "Урок «l-order»: нет вопроса «missing-1» — в файле такого id нет или вопрос пропущен",
  ]) {
    check(`«Что пропущено»: ${item}`, await visible(courseMessage.getByText(item, { exact: true })));
  }
  await t.shot(page, "report", true);

  // Экран набора: стеклянная «Учиться» под «Начать» и ссылка на оглавление.
  await openSet("Курс для проверки");
  const learn = page.getByRole("button", { name: /^(Учиться|Продолжить обучение)/ });
  const courseLink = page.getByRole("button", { name: "Оглавление", exact: true });
  check("у набора с уроками — «Учиться»", (await visible(learn)) && (await learn.innerText()).startsWith("Учиться"));
  check("…и в ней первый урок: «урок 1 из 3 · Первый урок»", await visible(learn.getByText("урок 1 из 3 · Первый урок")));
  check(
    "«Учиться» — стеклянная, под «Начать»",
    await learn.evaluate((el) => {
      const start = [...document.querySelectorAll("button")].find((b) => b.textContent?.startsWith("Начать"));
      return !!start && start.getBoundingClientRect().bottom <= el.getBoundingClientRect().top && el.className.includes("glass");
    }),
  );
  await t.shot(page, "set-home");

  // Оглавление: порядок файла, разделы.
  await courseLink.click();
  await page.getByRole("heading", { name: "Оглавление" }).waitFor();
  check("экраны уроков подгрузились отдельным файлом", chunkRequests === 1, `запросов: ${chunkRequests}`);
  const rows = page.locator("main li button");
  const titles = await rows.evaluateAll((list) => list.map((b) => b.querySelector("span span")?.textContent));
  check(
    "оглавление в порядке файла, битые уроки пропущены",
    JSON.stringify(titles) === JSON.stringify(["Первый урок", "Порядок важнее подтемы", "Последний урок"]),
    JSON.stringify(titles),
  );
  check("разделы оглавления", (await visible(page.getByText("Раздел А", { exact: true }))) && (await visible(page.getByText("Раздел Б", { exact: true }))));
  check("число вопросов у уроков", (await rows.nth(0).innerText()).includes("2 вопроса") && (await rows.nth(2).innerText()).includes("без вопросов"));
  await t.shot(page, "course");

  // Урок и его разметка.
  await rows.nth(0).click();
  await lessonTitle("Первый урок").waitFor();
  const picture = page.getByRole("img", { name: "Схема кэша" });
  await picture.waitFor();
  await page.waitForFunction(() => [...document.images].some((img) => img.alt === "Схема кэша" && img.complete && img.naturalWidth > 0));
  check("картинка по относительному пути от ссылки набора загрузилась", await visible(picture));
  check(
    "у картинки no-referrer, lazy и подпись из title",
    (await picture.getAttribute("referrerpolicy")) === "no-referrer" &&
      (await picture.getAttribute("loading")) === "lazy" &&
      (await visible(page.getByText("Подпись к схеме"))),
  );
  await page.getByText("Картинка: Пропавшая схема").waitFor({ timeout: 5000 }).catch(() => undefined);
  check("не загрузилась — заглушка с alt", await visible(page.getByText("Картинка: Пропавшая схема")));
  check("таблица в прокручиваемой рамке", (await page.locator('[role="region"][aria-label="Таблица"] table').count()) === 1);
  check("блок кода с подсветкой", (await page.locator("pre", { hasText: "const answer = 42;" }).locator(".token").count()) > 0);
  check("цитата — блок «важно»", await visible(page.locator("blockquote", { hasText: "Важная мысль урока." })));
  const mdn = page.getByRole("link", { name: "MDN" });
  check("внешняя ссылка — новая вкладка и noreferrer", (await mdn.getAttribute("target")) === "_blank" && (await mdn.getAttribute("rel")) === "noreferrer");
  check("ссылка javascript: — просто текст", !(await page.getByRole("link", { name: "ссылка", exact: true }).count()));
  check(
    "HTML в тексте не исполняется и виден как текст",
    (await page.evaluate(() => [window.__lessonScript, window.__lessonImg].every((v) => v === undefined))) &&
      (await visible(page.getByText(/<script>window.__lessonScript/))),
  );
  check("390px: урок не вылезает вбок", (await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) === 0);
  await page.setViewportSize({ width: 360, height: 800 });
  check("360px: урок не вылезает вбок", (await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) === 0);
  await t.shot(page, "lesson-360", true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("sup a").first().click();
  await page.waitForTimeout(400);
  check("сноска прокручивает урок, а не уводит с экрана", (await visible(lessonTitle("Первый урок"))) && (await page.evaluate(() => location.hash)) === "");

  // Вопросы урока: по подтеме, в порядке файла. Ответы — не в ленту.
  await page.getByRole("button", { name: "К вопросам (2)" }).click();
  await page.getByText("1 / 2").waitFor();
  check("первый вопрос урока — по подтеме, в порядке файла", await visible(page.getByText("Вопрос один")));
  await answer("Правильный");
  check("разбор после ответа", await visible(page.getByRole("status").getByText("Верно", { exact: true })));
  await page.getByRole("button", { name: "Дальше" }).click();
  await page.getByText("2 / 2").waitFor();
  check("второй вопрос — «Вопрос два»", await visible(page.getByText("Вопрос два")));
  await t.shot(page, "quiz");

  // Приложение закрыли посреди вопросов урока, на втором вопросе.
  await page.reload();
  await page.getByText("Что тренируем?").waitFor();
  check("ответы обучения не попали в ленту", (await countAnswers(page)) === answersBefore, `ответов: ${await countAnswers(page)}`);
  check("незаконченная тренировка не перезаписана", (await page.evaluate(() => localStorage.getItem("fq.activeSession"))) === savedSession);
  check("плашка незаконченной тренировки на главной на месте", await visible(page.getByRole("status").filter({ hasText: "Незаконченная сессия" })));
  await openSets();
  await openSet("Курс для проверки");
  check(
    "«Продолжить обучение» с номером вопроса",
    (await learn.innerText()).startsWith("Продолжить обучение") && (await visible(learn.getByText(/вопрос 2 из 2/))),
    await learn.innerText(),
  );
  await courseLink.click();
  check("отметка «прочитан» пережила перезагрузку", (await rows.nth(0).innerText()).includes("прочитан"));
  await page.getByRole("button", { name: "Назад" }).click();
  await learn.click();
  await page.getByText("2 / 2").waitFor();
  check("«Продолжить обучение» вернул к вопросу 2", await visible(page.getByText("Вопрос два")));
  await page.goBack();
  await lessonTitle("Первый урок").waitFor();
  check("системная «Назад» из вопросов — к тексту урока", await visible(page.getByRole("button", { name: "Продолжить вопросы · 2 из 2" })));
  await page.getByRole("button", { name: "Продолжить вопросы · 2 из 2" }).click();
  await page.getByText("2 / 2").waitFor();
  await page.getByRole("button", { name: "Не знаю" }).click();
  check(
    "«Не знаю» в обучении не обещает «Ошибки»",
    (await visible(page.getByText("Ответ показан", { exact: true }))) && !(await page.getByText(/Прорешать ошибки/).count()),
  );
  await t.shot(page, "gave-up");
  await page.getByRole("button", { name: "Завершить" }).click();
  check("итог: «Верно 1 из 2» с учётом ответа до перезагрузки", await visible(page.getByText("Верно 1 из 2")));
  await t.shot(page, "summary");

  // Явный список вопросов важнее подтемы.
  await page.getByRole("button", { name: "Следующий урок" }).click();
  await lessonTitle("Порядок важнее подтемы").waitFor();
  await page.getByRole("button", { name: "К вопросам (2)" }).click();
  await page.getByText("1 / 2").waitFor();
  check("список questions: сначала «Вопрос три» из другой подтемы", await visible(page.getByText("Вопрос три")));
  await answer("Правильный");
  await page.getByRole("button", { name: "Дальше" }).click();
  check("…потом «Вопрос один»", await visible(page.getByText("Вопрос один")));
  await answer("Правильный");
  await page.getByRole("button", { name: "Завершить" }).click();
  await page.getByText("Верно 2 из 2").waitFor();
  await page.getByRole("button", { name: "Пройти вопросы ещё раз" }).click();
  check("«Пройти вопросы ещё раз» — с первого вопроса", (await visible(page.getByText("1 / 2"))) && (await visible(page.getByText("Вопрос три"))));
  await answer("Правильный");
  await page.getByRole("button", { name: "Дальше" }).click();
  await answer("Правильный");
  await page.getByRole("button", { name: "Завершить" }).click();
  await page.getByRole("button", { name: "Следующий урок" }).click();
  await lessonTitle("Последний урок").waitFor();
  await page.getByRole("button", { name: "Завершить курс" }).click();
  await page.getByRole("heading", { name: "Оглавление" }).waitFor();
  check("последний урок → оглавление «Курс пройден»", await visible(page.getByText("Курс пройден: прочитаны все уроки.")));
  await t.shot(page, "finished");
  await page.goBack();
  await page.getByRole("heading", { level: 1, name: "Курс для проверки" }).waitFor();
  check("«Назад» из оглавления — к набору, уроки не копятся в истории", await visible(learn));
  check(
    "курс пройден: «Курс пройден · прочитано 3 из 3» и снова «Учиться»",
    (await visible(learn.getByText("Курс пройден · прочитано 3 из 3"))) && (await learn.innerText()).startsWith("Учиться"),
  );

  check("после всего обучения лента ответов прежняя", (await countAnswers(page)) === answersBefore);
  await page.goto(t.url);
  await page.getByText("Что тренируем?").waitFor();
  await page.getByRole("button", { name: "Кабинет" }).click();
  check("достижений не прибавилось", (await page.getByRole("button", { name: /^Достижения/ }).innerText()) === achievementsBefore);

  // Резервная копия: прогресс уроков выгружается и загружается.
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Сохранить копию" }).click();
  const backupPath = join(t.outDir, "lessons-backup.json");
  await (await downloading).saveAs(backupPath);
  const backup = JSON.parse(readFileSync(backupPath, "utf8"));
  const course = backup.lessons?.find((c) => Object.keys(c.read).includes("l-intro"));
  check(
    "в копии версии 3 — прогресс уроков, метка прежняя",
    backup.format === "frontend-quiz-notes" && backup.version === 3 && Array.isArray(backup.notes) && Object.keys(course?.read ?? {}).length === 3,
    JSON.stringify(backup.lessons),
  );

  // Сброс курса — отдельной кнопкой в оглавлении.
  await page.getByRole("button", { name: "Назад" }).click();
  await openSets();
  await openSet("Курс для проверки");
  await courseLink.click();
  await page.getByRole("button", { name: "Сбросить прогресс курса" }).click();
  await t.shot(page, "reset-confirm");
  await page.getByRole("dialog").getByRole("button", { name: "Сбросить" }).click();
  check("сброс курса снял отметки", !(await page.getByText(/прочитан ·/).count()) && !(await page.getByRole("button", { name: "Сбросить прогресс курса" }).isVisible()));
  await page.getByRole("button", { name: "Назад" }).click();
  check("после сброса — «Учиться» с первого урока", (await visible(learn.getByText("урок 1 из 3 · Первый урок"))) && (await learn.innerText()).startsWith("Учиться"));

  await page.goto(t.url);
  await openCabinet(page, t.url);
  const upload = page.locator('input[type="file"]');
  const status = page.getByRole("status");
  await upload.setInputFiles(backupPath);
  check("загрузка копии: «Прогресс уроков обновлён: 1 набор.»", (await status.innerText()).includes("Прогресс уроков обновлён: 1 набор."), await status.innerText());
  await upload.setInputFiles(backupPath);
  check("повторная загрузка прогресс не меняет", !(await status.innerText()).includes("Прогресс уроков"), await status.innerText());
  const oldBackup = JSON.stringify({ ...backup, version: 2, lessons: undefined });
  await upload.setInputFiles(fileInput("old.json", oldBackup));
  check("старая копия без уроков: свой прогресс остался", (await status.innerText()).includes("Прогресса уроков в копии нет — твой остался как был."), await status.innerText());
  await page.getByRole("button", { name: "Назад" }).click();
  await openSets();
  await openSet("Курс для проверки");
  check("прогресс вернулся из копии", await visible(learn.getByText("Курс пройден · прочитано 3 из 3")));

  // Обновление набора: изменились только уроки — сообщение об этом говорит.
  courseYaml = lessonsSetYaml({
    firstTitle: "Первый урок, исправленный",
    extraLesson: "  - id: l-new\n    title: Новый урок\n    body: Текст.\n",
  });
  await page.getByRole("button", { name: "Обновить набор" }).click();
  check(
    "обновление: «Набор обновлён. Уроки: новых 1, изменено 1.»",
    await visible(page.getByText("Набор обновлён. Уроки: новых 1, изменено 1.")),
    await page.getByRole("status").first().innerText(),
  );
  check("новый урок — следующим в «Учиться»", await visible(learn.getByText("урок 4 из 4 · Новый урок")));

  await context.close();
  await offline(t, files, image);
  await scroll(t);
}

/**
 * Прокрутка на длинных уроках: «Следующий урок» из итога вопросов открывает новый урок с начала, а системная
 * «Назад» из вопросов возвращает туда, где человек дочитал урок.
 */
async function scroll(t) {
  const { check } = t;
  const filler = Array.from({ length: 60 }, (_, i) => `      Абзац ${i + 1}: длинный текст, чтобы урок прокручивался.\n`).join("\n");
  const yaml = `title: Длинные уроки
lessons:
  - id: a
    subtopic: S
    title: Длинный урок А
    body: |
${filler}
  - id: b
    title: Длинный урок Б
    body: |
${filler}
questions:
  - id: q
    subtopic: S
    level: junior
    question: Вопрос о прокрутке
    options:
      - text: 'Правильный'
        correct: true
      - text: 'Мимо'
`;
  const context = await t.newContext({ serviceWorkers: "block" });
  await context.route(`${BASE}**`, (route) => route.fulfill({ status: 200, contentType: "text/plain; charset=utf-8", body: yaml }));
  try {
    const page = await context.newPage();
    const scrollY = () => page.evaluate(() => Math.round(window.scrollY));
    const toBottom = async () => {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(200);
    };
    await page.goto(t.url);
    await page.getByText("Что тренируем?").waitFor();
    await page.getByRole("button", { name: /Мои наборы/ }).click();
    await page.getByRole("textbox", { name: "Ссылка на YAML-файл" }).fill(`${BASE}long.yaml`);
    await page.getByRole("button", { name: "Добавить", exact: true }).click();
    await page.getByRole("button", { name: /^Длинные уроки/ }).first().click();
    await page.getByRole("button", { name: /^Учиться/ }).click();
    await page.getByRole("heading", { level: 1, name: "Длинный урок А" }).waitFor();
    await toBottom();
    const readTo = await scrollY();
    await page.getByRole("button", { name: /К вопросам/ }).click();
    await page.getByText("1 / 1").waitFor();
    await page.goBack();
    await page.getByRole("heading", { level: 1, name: "Длинный урок А" }).waitFor();
    await page.waitForTimeout(500);
    check("«Назад» из вопросов — туда, где дочитал урок", readTo > 1000 && Math.abs((await scrollY()) - readTo) < 50, `${await scrollY()} из ${readTo}`);
    await page.getByRole("button", { name: /К вопросам/ }).click();
    await page.getByText("1 / 1").waitFor();
    await page.getByRole("button", { name: /Правильный/ }).first().click();
    await page.getByRole("button", { name: "Завершить" }).click();
    await page.getByRole("button", { name: "Следующий урок" }).click();
    await page.getByRole("heading", { level: 1, name: "Длинный урок Б" }).waitFor();
    await page.waitForTimeout(500);
    check("«Следующий урок» из итога вопросов — с начала урока", (await scrollY()) === 0, `scrollY ${await scrollY()}`);
  } finally {
    await context.close();
  }
}

/** Без сети: экраны уроков — из кэша приложения, увиденная картинка урока — из кэша картинок. */
async function offline(t, files, image) {
  const { check, visible } = t;
  const context = await t.newContext();
  await context.route(`${BASE}**`, (route) => {
    const name = new URL(route.request().url()).pathname.split("/main/")[1];
    if (name === "images/pic.png") {
      return route.fulfill({ status: 200, contentType: "image/png", headers: { "Access-Control-Allow-Origin": "*" }, body: image });
    }
    const file = files[name];
    return file ? route.fulfill({ status: 200, contentType: "text/plain; charset=utf-8", body: file() }) : route.fulfill({ status: 404 });
  });
  try {
    const page = await context.newPage();
    await page.goto(t.url);
    await page.getByText("Что тренируем?").waitFor();
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await page.getByText("Что тренируем?").waitFor();
    await page.getByRole("button", { name: /Мои наборы/ }).click();
    await page.getByRole("textbox", { name: "Ссылка на YAML-файл" }).fill(`${BASE}course.yaml`);
    await page.getByRole("button", { name: "Добавить", exact: true }).click();
    await page.getByRole("button", { name: /^Курс для проверки/ }).first().click();
    await page.getByRole("button", { name: "Учиться" }).click();
    await page.getByRole("heading", { level: 1, name: "Первый урок" }).waitFor();
    await page.waitForFunction(() => [...document.images].some((img) => img.alt === "Схема кэша" && img.complete && img.naturalWidth > 0));
    const cached = await page.evaluate(async () => {
      const cache = await caches.open("lesson-images");
      return (await cache.keys()).map((r) => new URL(r.url).pathname);
    });
    check("увиденная картинка урока — в кэше картинок", cached.some((path) => path.endsWith("/images/pic.png")), JSON.stringify(cached));

    await context.setOffline(true);
    await page.goto(t.url);
    await page.getByText("Что тренируем?").waitFor();
    await page.getByRole("button", { name: /Мои наборы/ }).click();
    await page.getByRole("button", { name: /^Курс для проверки/ }).first().click();
    await page.getByRole("button", { name: "Продолжить обучение" }).click();
    check("без сети урок открывается", await visible(page.getByRole("heading", { level: 1, name: "Первый урок" })));
    const shown = await page
      .waitForFunction(() => [...document.images].some((img) => img.alt === "Схема кэша" && img.complete && img.naturalWidth > 0), null, { timeout: 5000 })
      .then(() => true, () => false);
    check("без сети картинка урока на месте", shown);
    await t.shot(page, "offline");
  } finally {
    await context.close();
  }
}
