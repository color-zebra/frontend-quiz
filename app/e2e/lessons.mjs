// Режим обучения: уроки в наборе, оглавление, урок и его разметка, вопросы урока по порядку, «Продолжить обучение»,
// ничего не пишется в ленту ответов и не трогает незаконченную тренировку, сброс курса, резервная копия, обновление.
// Здесь же картинки в вопросах: это та же картинка, что в уроке.
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

/** Аудио уроков набора, как оно сохранено на устройстве: id урока → ссылка или null. */
function readStoredAudio(page, title) {
  return page.evaluate(
    (setTitle) =>
      new Promise((resolve, reject) => {
        const open = indexedDB.open("frontend-quiz-sets");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const request = open.result.transaction("sets").objectStore("sets").getAll();
          request.onsuccess = () => {
            const record = request.result.find((r) => r.title === setTitle);
            resolve(Object.fromEntries((record?.file.lessons ?? []).map((l) => [l.id, l.audio ?? null])));
          };
          request.onerror = () => reject(request.error);
        };
      }),
    title,
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
    await page.getByRole("button", { name: /Свои наборы/ }).click();
    await page.getByRole("heading", { name: "Свои наборы" }).waitFor();
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
  await page.getByRole("heading", { name: "Тренажёр" }).waitFor();

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
  await page.getByRole("heading", { name: "Тренажёр" }).waitFor();
  const savedSession = await page.evaluate(() => localStorage.getItem("fq.activeSession"));
  const answersBefore = await countAnswers(page);
  check("до обучения: незаконченная тренировка и один ответ в ленте", !!savedSession && answersBefore === 1, `ответов: ${answersBefore}`);
  await page.getByRole("button", { name: "Кабинет" }).click();
  const achievementsBefore = await page.getByRole("button", { name: /^Достижения/ }).innerText();
  await page.getByRole("button", { name: "Тренажёр" }).click();

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
    "Урок «l-last»: аудио только по ссылке https:// — «http://audio.example.test/last.mp3» пропущено",
  ]) {
    check(`«Что пропущено»: ${item}`, await visible(courseMessage.getByText(item, { exact: true })));
  }
  await t.shot(page, "report", true);

  // Озвучка: относительный путь — от ссылки набора, полная https-ссылка — как есть, http — без аудио.
  const audio = await readStoredAudio(page, "Курс для проверки");
  check(
    "аудио уроков: путь от ссылки набора, https как есть, http пропущен",
    JSON.stringify(audio) ===
      JSON.stringify({ "l-intro": `${BASE}audio/intro.mp3`, "l-order": "https://audio.example.test/order.mp3", "l-last": null }),
    JSON.stringify(audio),
  );
  await page.locator('input[type="file"]').setInputFiles(
    fileInput(
      "audio-file.yaml",
      `title: Файл с аудио
lessons:
  - id: a
    title: Урок
    audio: audio/a.mp3
    body: Текст.
questions:
  - id: q
    level: junior
    question: Вопрос
    options:
      - text: да
        correct: true
      - text: нет
`,
    ),
  );
  const fileMessage = page.getByRole("status").filter({ hasText: "Файл с аудио" }).first();
  await fileMessage.getByText("Что поправить в файле").click();
  check(
    "набор из файла: относительный путь к аудио — замечание",
    await visible(fileMessage.getByText("Урок «a»: у набора из файла аудио по относительному пути не работает — нужна полная ссылка https://")),
  );

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
  await imageViewer(t, page);
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
  await page.getByRole("heading", { name: "Тренажёр" }).waitFor();
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
  check("«К вопросам» отметку «освоен» не ставит", !(await rows.nth(0).innerText()).includes("освоен"));
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
  check("с ошибкой урок не освоен — так и сказано", await visible(page.getByText("Для отметки «освоен» нужны все ответы верно за один проход.")));
  const navButtons = page.locator("main div > button");
  check("с ошибкой главная кнопка — «Пройти вопросы ещё раз»", (await navButtons.first().innerText()).includes("Пройти вопросы ещё раз"), await navButtons.first().innerText());
  await t.shot(page, "summary");
  await page.getByRole("button", { name: "Пройти вопросы ещё раз" }).click();
  await page.getByText("1 / 2").waitFor();
  await answer("Правильный");
  await page.getByRole("button", { name: "Дальше" }).click();
  await answer("Правильный");
  await page.getByRole("button", { name: "Завершить" }).click();
  check("проход без ошибок — «Урок освоен»", (await visible(page.getByText("Верно 2 из 2"))) && (await visible(page.getByText("Урок освоен", { exact: true }))));
  check("освоил — главная кнопка «Следующий урок»", (await navButtons.first().innerText()).includes("Следующий урок"));
  await t.shot(page, "summary-mastered");

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
  await answer("Мимо А");
  await page.getByRole("button", { name: "Дальше" }).click();
  await answer("Правильный");
  await page.getByRole("button", { name: "Завершить" }).click();
  check("ошибся после освоения — отметка остаётся", await visible(page.getByText("Урок уже освоен раньше — отметка остаётся.")));
  await page.getByRole("button", { name: "Следующий урок" }).click();
  await lessonTitle("Последний урок").waitFor();
  await page.getByRole("button", { name: "Завершить курс" }).click();
  await page.getByRole("heading", { name: "Оглавление" }).waitFor();
  check("последний урок без вопросов освоен кнопкой — «Курс пройден: все уроки освоены.»", await visible(page.getByText("Курс пройден: все уроки освоены.")));
  check(
    "на странице курса «Уроки освоены 3 из 3» и отметки у всех уроков",
    (await visible(page.getByText("3 из 3", { exact: true }).first())) && (await page.getByText("освоен ·").count()) === 3,
  );
  await t.shot(page, "finished");
  await page.goBack();
  await page.getByRole("heading", { level: 1, name: "Курс для проверки" }).waitFor();
  check("«Назад» из оглавления — к набору, уроки не копятся в истории", await visible(learn));
  check(
    "курс пройден: «Курс пройден · освоено 3 из 3» и снова «Учиться»",
    (await visible(learn.getByText("Курс пройден · освоено 3 из 3"))) && (await learn.innerText()).startsWith("Учиться"),
  );

  check("после всего обучения лента ответов прежняя", (await countAnswers(page)) === answersBefore);
  await page.goto(t.url);
  await page.getByRole("heading", { name: "Тренажёр" }).waitFor();
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
  await page.getByRole("button", { name: "Тренажёр" }).click();
  await openSets();
  await openSet("Курс для проверки");
  await courseLink.click();
  await page.getByRole("button", { name: "Сбросить прогресс курса" }).click();
  await t.shot(page, "reset-confirm");
  await page.getByRole("dialog").getByRole("button", { name: "Сбросить" }).click();
  check("сброс курса снял отметки", !(await page.getByText(/освоен ·/).count()) && !(await page.getByRole("button", { name: "Сбросить прогресс курса" }).isVisible()));
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
  await page.getByRole("button", { name: "Тренажёр" }).click();
  await openSets();
  await openSet("Курс для проверки");
  check("прогресс вернулся из копии", await visible(learn.getByText("Курс пройден · освоено 3 из 3")));

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
  await questionImages(t, image);
}

/**
 * Картинки в вопросе и разборе — та же картинка, что в уроке: путь от ссылки набора, увеличение (и оно не выбирает
 * ответ), описание вместо картинки в строке списка ошибок, плашка у набора из файла с относительным путём.
 */
async function questionImages(t, image) {
  const { check, visible } = t;
  const yaml = `title: Картинки в вопросах
questions:
  - id: q
    level: junior
    question: |
      Какая форма быстрее заполняется?

      ![Две формы входа](images/forms.png "А слева, Б справа")
    options:
      - text: 'А — подписи слева'
        why: 'Нет.'
      - text: 'Б — подписи над полями'
        correct: true
        why: 'Да.'
    explanation: |
      Глаз идёт сверху вниз.

      ![Путь взгляда](images/path.png)
`;
  const context = await t.newContext({ serviceWorkers: "block" });
  const requested = [];
  await context.route(`${BASE}**`, (route) => {
    const name = new URL(route.request().url()).pathname.split("/main/")[1];
    if (name.startsWith("images/")) {
      requested.push(name);
      return route.fulfill({ status: 200, contentType: "image/png", headers: { "Access-Control-Allow-Origin": "*" }, body: image });
    }
    return route.fulfill({ status: 200, contentType: "text/plain; charset=utf-8", body: yaml });
  });
  const loaded = (page, alt) =>
    page
      .waitForFunction((a) => [...document.images].some((img) => img.alt === a && img.complete && img.naturalWidth > 0), alt, { timeout: 5000 })
      .then(() => true, () => false);
  try {
    const page = await context.newPage();
    await page.goto(t.url);
    await page.getByRole("heading", { name: "Тренажёр" }).waitFor();
    await page.getByRole("button", { name: /Свои наборы/ }).click();
    await page.getByRole("textbox", { name: "Ссылка на YAML-файл" }).fill(`${BASE}pictures.yaml`);
    await page.getByRole("button", { name: "Добавить", exact: true }).click();
    await page.getByRole("button", { name: /^Картинки в вопросах/ }).first().click();
    await page.getByRole("button", { name: /^Начать/ }).click();
    await page.getByText("1 / 1").waitFor();

    check(
      "картинка в вопросе — по пути от ссылки набора, с подписью",
      (await loaded(page, "Две формы входа")) && requested.includes("images/forms.png") && (await visible(page.getByText("А слева, Б справа"))),
    );
    await page.getByRole("button", { name: "Открыть на весь экран: Две формы входа" }).click();
    const viewer = page.getByRole("dialog", { name: "Картинка: Две формы входа" });
    await viewer.waitFor();
    await page.waitForTimeout(300);
    await t.shot(page, "question-image-viewer");
    await page.keyboard.press("Escape");
    await viewer.waitFor({ state: "hidden" });
    check(
      "увеличение картинки не выбирает ответ",
      !(await visible(page.getByRole("button", { name: "Завершить" }), 500)) &&
        (await page.getByRole("button", { name: /А — подписи слева/ }).isEnabled()),
    );
    await t.shot(page, "question-image");

    await page.getByRole("button", { name: /А — подписи слева/ }).click();
    check("картинка в разборе «Как это устроено»", await loaded(page, "Путь взгляда"));
    await page.getByRole("img", { name: "Путь взгляда" }).scrollIntoViewIfNeeded();
    await t.shot(page, "question-image-explanation");
    await page.getByRole("button", { name: "Завершить" }).click();
    check("в списке ошибок вместо картинки — её описание", await visible(page.getByText("картинка: Две формы входа")));
    await page.getByText("картинка: Две формы входа").scrollIntoViewIfNeeded();
    await t.shot(page, "question-image-summary");

    // Набор из файла: относительный путь не от чего считать — плашка с описанием, а не битая картинка.
    await page.goto(t.url);
    await page.getByRole("heading", { name: "Тренажёр" }).waitFor();
    await page.getByRole("button", { name: /Свои наборы/ }).click();
    await page.locator('input[type="file"]').setInputFiles(fileInput("pictures-file.yaml", yaml.replace("Картинки в вопросах", "Картинки из файла")));
    await page.getByRole("button", { name: /^Картинки из файла/ }).first().click();
    await page.getByRole("button", { name: /^Начать/ }).click();
    await page.getByText("1 / 1").waitFor();
    check(
      "набор из файла: вместо картинки по относительному пути — описание и причина",
      (await visible(page.getByText("Картинка: Две формы входа"))) && (await visible(page.getByText(/нужна полная ссылка https/))),
    );
    await t.shot(page, "question-image-file");
  } finally {
    await context.close();
  }
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
    await page.getByRole("heading", { name: "Тренажёр" }).waitFor();
    await page.getByRole("button", { name: /Свои наборы/ }).click();
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

/** Картинка урока на весь экран: увеличение, двойной клик, закрытие по Esc и системной «Назад» — урок на месте. */
async function imageViewer(t, page) {
  const { check, visible } = t;
  const viewer = page.getByRole("dialog", { name: "Картинка: Схема кэша" });
  const zoom = viewer.locator("[aria-live]");
  const zoomIs = async (text) => (await zoom.textContent())?.trim() === text;

  await page.getByRole("button", { name: "Открыть на весь экран: Схема кэша" }).click();
  await viewer.waitFor();
  await page.waitForFunction(() => {
    const img = document.querySelector("dialog[open] img");
    return img && img.complete && img.getBoundingClientRect().width > 0;
  });
  check("кнопка под картинкой открывает её на весь экран, с подписью", (await zoomIs("100%")) && (await visible(viewer.getByText("Подпись к схеме"))));
  check("на весь экран: страница не вылезает вбок", (await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) === 0);
  await viewer.getByRole("button", { name: "Увеличить" }).click();
  check("кнопка «Увеличить» — 150%", await zoomIs("150%"));
  const box = await viewer.locator("img").boundingBox();
  await page.mouse.move(195, 420);
  await page.mouse.wheel(0, -300);
  await page.waitForTimeout(200);
  const zoomed = await viewer.locator("img").boundingBox();
  check("колесо мыши увеличивает дальше", Number.parseInt((await zoom.textContent()) ?? "0") > 150 && zoomed.width > box.width);
  await page.mouse.dblclick(195, 420);
  await page.waitForTimeout(200);
  check("двойной клик по увеличенной — вписать обратно", await zoomIs("100%"));
  await page.mouse.dblclick(195, 420);
  await page.waitForTimeout(200);
  check("двойной клик по вписанной — увеличить в 2,5 раза", await zoomIs("250%"));
  await t.shot(page, "image-viewer");
  await page.keyboard.press("Escape");
  await viewer.waitFor({ state: "hidden" });
  check(
    "Esc закрывает просмотр, лишней записи в истории нет",
    (await visible(page.getByRole("heading", { level: 1, name: "Первый урок" }))) &&
      !(await page.evaluate(() => history.state?.imageViewer)),
  );

  await page.getByRole("img", { name: "Схема кэша" }).click();
  await viewer.waitFor();
  check("нажатие по самой картинке тоже открывает просмотр", await visible(viewer));
  await page.goBack();
  await viewer.waitFor({ state: "hidden" });
  check("системная «Назад» закрывает просмотр, а не уводит из урока", await visible(page.getByRole("heading", { level: 1, name: "Первый урок" })));
}

/** Без сети: экраны уроков — из кэша приложения, увиденная картинка урока — из кэша картинок. */
async function offline(t, files, image) {
  const { check, visible } = t;
  const context = await t.newContext();
  // Подставные ответы Playwright отдаёт и в режиме «без сети» — с выключенной сетью рвём соединение сами,
  // иначе картинка «без сети» пришла бы от теста, а не из кэша.
  let networkDown = false;
  await context.route(`${BASE}**`, (route) => {
    if (networkDown) return route.abort("internetdisconnected");
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
    await page.getByRole("heading", { name: "Тренажёр" }).waitFor();
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await page.getByRole("heading", { name: "Тренажёр" }).waitFor();
    await page.getByRole("button", { name: /Свои наборы/ }).click();
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

    networkDown = true;
    await context.setOffline(true);
    await page.goto(t.url);
    await page.getByRole("heading", { name: "Тренажёр" }).waitFor();
    await page.getByRole("button", { name: /Свои наборы/ }).click();
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
