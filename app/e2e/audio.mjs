// Озвучка уроков: «Слушать урок», сворачиваемый плеер на всех экранах (значок в углу, при нижней панели — над ней),
// большой плеер на шторке, экран блокировки (Media Session), место в аудио после перезагрузки, ±15 секунд, меню
// скоростей, конец урока («К вопросам урока», «Урок N+1»), значок не закрывает кнопки, удаление набора.
// Звук — тишина в WAV, собранная здесь же: файлов из репозитория с аудио тесты не знают.
import { openSettings } from "./fixtures.mjs";

const BASE = "https://raw.githubusercontent.com/test/audio/main/";
const SECONDS = 40;
/** Картинка 1×1 — для урока с картинкой и подписью. */
const PIXEL = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");

/** WAV с тишиной: 8 кГц, моно, 16 бит. */
function silentWav(seconds) {
  const rate = 8000;
  const data = rate * 2 * seconds;
  const wav = Buffer.alloc(44 + data);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(36 + data, 4);
  wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24);
  wav.writeUInt32LE(rate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(data, 40);
  return wav;
}

const COURSE = `title: Курс со звуком
lessons:
  - id: a
    subtopic: S
    title: Урок со звуком
    audio: audio/a.wav
    body: |
      ![Схема урока](images/pic.png "Подпись к картинке урока — длинная, чтобы переноситься рядом с кнопкой")

${Array.from({ length: 40 }, (_, i) => `      Абзац ${i + 1} урока, чтобы было что прокручивать.\n`).join("\n")}
  - id: a2
    title: Второй звуковой урок
    audio: audio/a2.wav
    body: Текст второго урока.
  - id: b
    title: Урок без звука
    body: Текст.
questions:
  - id: q
    subtopic: S
    level: junior
    question: Вопрос урока
    options:
      - text: 'Правильный'
        correct: true
      - text: 'Мимо'
`;

export default async function audioSuite(t) {
  const { check, visible } = t;
  const wav = silentWav(SECONDS);
  const context = await t.newContext({ serviceWorkers: "block" });
  // Файл отдаётся кусками (206), как с GitHub: иначе Chrome не даст перематывать.
  await context.route(`${BASE}**`, (route) => {
    const name = new URL(route.request().url()).pathname.split("/main/")[1];
    if (name === "course.yaml") return route.fulfill({ status: 200, contentType: "text/plain; charset=utf-8", body: COURSE });
    if (name === "images/pic.png") return route.fulfill({ status: 200, contentType: "image/png", headers: { "Access-Control-Allow-Origin": "*" }, body: PIXEL });
    if (name !== "audio/a.wav" && name !== "audio/a2.wav") return route.fulfill({ status: 404 });
    const range = /bytes=(\d+)-(\d*)/.exec(route.request().headers().range ?? "");
    if (!range) return route.fulfill({ status: 200, contentType: "audio/wav", headers: { "Accept-Ranges": "bytes" }, body: wav });
    const start = Number(range[1]);
    const end = range[2] ? Number(range[2]) : wav.length - 1;
    return route.fulfill({
      status: 206,
      contentType: "audio/wav",
      headers: { "Accept-Ranges": "bytes", "Content-Range": `bytes ${start}-${end}/${wav.length}` },
      body: wav.subarray(start, end + 1),
    });
  });
  const page = await context.newPage();
  // Свёрнутый плеер — значок; большой — шторка-диалог.
  const mini = page.getByRole("button", { name: /^Плеер урока «/ });
  const sheet = page.getByRole("dialog", { name: "Плеер урока" });
  const expand = async () => {
    await mini.click();
    await sheet.waitFor();
    // Шторка выезжает снизу 0,22 с — мерить и снимать после.
    await page.waitForTimeout(300);
  };
  const collapse = async () => {
    await sheet.getByRole("button", { name: "Свернуть плеер" }).click();
    await sheet.waitFor({ state: "hidden" });
  };
  const center = (box) => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
  const media = () =>
    page.evaluate(() => {
      const a = document.querySelector("audio");
      return { time: a.currentTime, paused: a.paused, rate: a.playbackRate, ended: a.ended, duration: a.duration };
    });
  const waitPlaying = () => page.waitForFunction(() => document.querySelector("audio").currentTime > 0.5 && !document.querySelector("audio").paused);
  const savedAudio = () =>
    page.evaluate(
      () =>
        new Promise((resolve) => {
          const open = indexedDB.open("frontend-quiz-lessons");
          open.onsuccess = () => {
            const request = open.result.transaction("progress").objectStore("progress").getAll();
            request.onsuccess = () => resolve(request.result.find((c) => c.audio || c.read)?.audio ?? {});
          };
        }),
    );
  const openLessonA = async () => {
    await page.getByRole("button", { name: /Свои наборы/ }).click();
    await page.getByRole("button", { name: /^Курс со звуком/ }).first().click();
    await page.getByRole("button", { name: "Оглавление", exact: true }).click();
    await page.getByRole("button", { name: /Урок со звуком/ }).click();
    await page.getByRole("heading", { level: 1, name: "Урок со звуком" }).waitFor();
  };

  await page.goto(t.url);
  await page.getByRole("heading", { name: "Тренажёр" }).waitFor();
  await page.getByRole("button", { name: /Свои наборы/ }).click();
  await page.getByRole("textbox", { name: "Ссылка на YAML-файл" }).fill(`${BASE}course.yaml`);
  await page.getByRole("button", { name: "Добавить", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Добавлен" }).waitFor();
  await page.getByRole("button", { name: "Назад" }).click();
  await openLessonA();

  // Слушать урок.
  check("у урока с аудио — «Слушать урок»", await visible(page.getByRole("button", { name: "Слушать урок" })));
  check("значка плеера до нажатия нет", !(await mini.isVisible()));
  // Как в установленном приложении во весь экран: плеер поднят над системной полоской Android. Chrome не умеет
  // эмулировать display-mode — подставляем то же значение --player-lift, что даёт @media (display-mode: fullscreen).
  await page.evaluate(() => document.documentElement.style.setProperty("--player-lift", "48px"));
  await page.getByRole("button", { name: "Слушать урок" }).click();
  await waitPlaying();
  check("звук пошёл, на уроке — «Пауза»", await visible(page.locator("main").getByRole("button", { name: "Пауза", exact: true })));
  // Пока играет звук, экран перерисовывается несколько раз в секунду. Картинка урока при этом не должна
  // пересоздаваться: иначе у подписи на миг пропадает кнопка «на весь экран» и подпись дёргается.
  const lessonImage = page.locator("main img").first();
  await lessonImage.evaluate((img) => (img.dataset.mark = "1"));
  await page.waitForTimeout(1500);
  check("пока играет звук, картинка урока не пересоздаётся", (await page.locator('main img[data-mark="1"]').count()) === 1);
  check("свёрнутый плеер: значок «играет» с названием урока", /«Урок со звуком»: играет/.test((await mini.getAttribute("aria-label")) ?? ""));
  const session = await page.evaluate(() => ({
    title: navigator.mediaSession.metadata?.title,
    artist: navigator.mediaSession.metadata?.artist,
    state: navigator.mediaSession.playbackState,
  }));
  check(
    "экран блокировки: урок, курс, «играет»",
    session.title === "Урок со звуком" && session.artist === "Курс со звуком" && session.state === "playing",
    JSON.stringify(session),
  );
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(200);
  const lastButton = await page.getByRole("button", { name: /К вопросам/ }).boundingBox();
  const miniBox = await mini.boundingBox();
  check("значок не закрывает кнопки в конце урока", lastButton.y + lastButton.height <= miniBox.y, `${lastButton.y + lastButton.height} / ${miniBox.y}`);
  const gap = (await page.evaluate(() => window.innerHeight)) - (miniBox.y + miniBox.height);
  check("во весь экран значок над системной полоской Android: 48 + 24 px снизу", Math.abs(gap - 72) <= 1, `отступ снизу ${gap}`);
  await t.shot(page, "lesson-playing");

  // Большой плеер со страницы урока: заголовок — не ссылка, «свернуть» там же, где был значок.
  await expand();
  check("развёрнут: название урока и «Урок 1 · курс»", (await visible(sheet.getByRole("heading", { name: "Урок со звуком" }))) && (await visible(sheet.getByText("Урок 1 · Курс со звуком"))));
  check("на странице урока заголовок плеера — не ссылка", (await sheet.getByRole("button", { name: /Урок 1 · Курс со звуком/ }).count()) === 0);
  const fold = center(await sheet.getByRole("button", { name: "Свернуть плеер" }).boundingBox());
  const spot = center(miniBox);
  check("«свернуть» ровно в точке значка", Math.abs(fold.x - spot.x) <= 2 && Math.abs(fold.y - spot.y) <= 2, `${JSON.stringify(fold)} / ${JSON.stringify(spot)}`);
  await t.shot(page, "player-open");
  await sheet.getByRole("button", { name: "Свернуть", exact: true }).click();
  await sheet.waitFor({ state: "hidden" });
  check("кнопка «свернуть» в шапке сворачивает, звук играет", !(await media()).paused);

  // Ушли с урока — звук продолжается; заголовок плеера ведёт к уроку.
  await page.getByRole("button", { name: "Назад" }).click();
  await page.getByRole("button", { name: "Назад" }).click();
  await page.getByRole("heading", { level: 1, name: "Курс со звуком" }).waitFor();
  const away = await media();
  check("ушли на экран набора — звук играет, значок на месте", !away.paused && (await visible(mini)), JSON.stringify(away));
  await t.shot(page, "set-home-playing");
  await expand();
  check("не на странице урока — заголовок плеера ссылкой", await visible(sheet.getByRole("button", { name: /Урок 1 · Курс со звуком/ })));
  await t.shot(page, "player-open-away");

  // ±15 секунд и меню скоростей.
  await page.evaluate(() => (document.querySelector("audio").currentTime = 10));
  await sheet.getByRole("button", { name: "+15 секунд" }).click();
  const forward = (await media()).time;
  await sheet.getByRole("button", { name: "−15 секунд" }).click();
  const backward = (await media()).time;
  check("+15 и −15 секунд", forward >= 24.5 && forward < 27 && backward >= 9.5 && backward < 12, `${forward} / ${backward}`);
  await sheet.getByRole("button", { name: "Скорость 1×" }).click();
  check("меню скоростей: 0,75× … 2×", (await sheet.getByRole("menuitemradio").allInnerTexts()).map((x) => x.trim()).join(" ") === "0,75× 1× 1,25× 1,5× 2×");
  await t.shot(page, "rate-menu");
  await sheet.getByRole("menuitemradio", { name: "1,25×" }).click();
  check("скорость 1,25×", (await visible(sheet.getByRole("button", { name: "Скорость 1,25×" }))) && (await media()).rate === 1.25);

  // Пауза — место записано; после перезагрузки урок предлагает продолжить с него.
  await sheet.getByRole("button", { name: "Пауза" }).click();
  await page.waitForTimeout(300);
  const pausedAt = Math.floor((await media()).time);
  check("пауза: на экране блокировки «на паузе»", (await page.evaluate(() => navigator.mediaSession.playbackState)) === "paused");
  check("пауза: место в аудио записано", (await savedAudio()).a === pausedAt, `${JSON.stringify(await savedAudio())} / ${pausedAt}`);
  await collapse();
  check("на паузе значок — «пауза»", /: пауза$/.test((await mini.getAttribute("aria-label")) ?? ""));
  await page.reload();
  await page.getByRole("heading", { name: "Тренажёр" }).waitFor();
  check("после перезагрузки плеера нет", !(await mini.isVisible()));
  await openLessonA();
  const resume = page.getByRole("button", { name: /^Продолжить слушать · с / });
  check("урок предлагает продолжить с того же места", await visible(resume), await page.locator("main").innerText().then((x) => x.slice(0, 200)));
  await resume.click();
  await waitPlaying();
  const resumed = await media();
  check("продолжил с сохранённой секунды, скорость запомнилась", resumed.time >= pausedAt - 0.5 && resumed.rate === 1.25, JSON.stringify(resumed));

  // Вопросы урока с играющим плеером: значок над нижней панелью, а не в углу.
  await page.getByRole("button", { name: /К вопросам/ }).click();
  await page.getByText("1 / 1").waitFor();
  const dock = await page.getByRole("button", { name: "Не знаю" }).boundingBox();
  check("в вопросах значок над нижней панелью", (await mini.boundingBox()).y + 60 <= dock.y);
  await t.shot(page, "quiz-playing");
  await page.goBack();
  await page.getByRole("heading", { level: 1, name: "Урок со звуком" }).waitFor();

  // Конец урока: тишина, место сброшено; в плеере — к вопросам, заново, следующий урок.
  await page.evaluate((s) => (document.querySelector("audio").currentTime = s - 1), SECONDS);
  await page.waitForFunction(() => document.querySelector("audio").ended, null, { timeout: 5000 });
  await page.waitForTimeout(300);
  check("дослушал — звук остановился, место сброшено, снова «Слушать урок»", (await media()).paused && (await savedAudio()).a === undefined && (await visible(page.getByRole("button", { name: "Слушать урок" }))));
  await expand();
  check(
    "дослушал — в плеере «Урок дослушан», «К вопросам урока», «Заново», «Урок 2»",
    (await visible(sheet.getByText("Урок дослушан"))) &&
      (await visible(sheet.getByRole("button", { name: "К вопросам урока" }))) &&
      (await visible(sheet.getByRole("button", { name: "Заново" }))) &&
      (await visible(sheet.getByRole("button", { name: "Урок 2" }))),
  );
  await t.shot(page, "ended");
  await sheet.getByRole("button", { name: "К вопросам урока" }).click();
  check("«К вопросам урока» открывает вопросы и сворачивает плеер", (await visible(page.getByText("1 / 1"))) && !(await sheet.isVisible()));
  await page.goBack();
  await page.getByRole("heading", { level: 1, name: "Урок со звуком" }).waitFor();
  await expand();
  await sheet.getByRole("button", { name: "Урок 2" }).click();
  await waitPlaying();
  check(
    "«Урок 2» — играет второй урок, страница урока сменилась на него",
    (await visible(page.getByRole("heading", { level: 1, name: "Второй звуковой урок" }))) &&
      /«Второй звуковой урок»: играет/.test((await mini.getAttribute("aria-label")) ?? ""),
  );
  await collapse();

  // Урок без аудио — без кнопки; заголовок плеера ведёт к уроку, который играет.
  await page.getByRole("button", { name: "Оглавление" }).click();
  await page.getByRole("button", { name: /Урок без звука/ }).click();
  await page.getByRole("heading", { level: 1, name: "Урок без звука" }).waitFor();
  check("у урока без аудио кнопки нет", !(await page.locator("main").getByRole("button", { name: /Слушать|Продолжить слушать/ }).count()));
  await expand();
  await sheet.getByRole("button", { name: /Урок 2 · Курс со звуком/ }).click();
  check(
    "заголовок плеера открывает урок, который играет, и сворачивает плеер",
    (await visible(page.getByRole("heading", { level: 1, name: "Второй звуковой урок" }))) && !(await sheet.isVisible()),
  );

  // Выключить плеер — значок и запас под него пропадают.
  await expand();
  await sheet.getByRole("button", { name: "Выключить плеер" }).click();
  check(
    "«Выключить плеер» — значка и запаса под него нет",
    !(await mini.isVisible()) && (await page.evaluate(() => document.documentElement.style.getPropertyValue("--audio-bar"))) === "",
  );

  // Удалили набор, пока играет урок, — плеер закрывается.
  // Без перезагрузки: перезагрузка и так заглушила бы звук. Назад по экранам до главной, звук всё это время играет.
  // Второй урок уже слушали — кнопка предлагает продолжить.
  await page.getByRole("button", { name: /^(Слушать урок|Продолжить слушать)/ }).click();
  await waitPlaying();
  for (let i = 0; i < 8 && !(await page.getByRole("heading", { name: "Тренажёр" }).isVisible()); i++) {
    await page.goBack();
    await page.waitForTimeout(200);
  }
  await page.getByRole("button", { name: /Свои наборы/ }).click();
  check("перед удалением звук играет", !(await media()).paused && (await mini.isVisible()));
  await page.getByRole("button", { name: "Удалить «Курс со звуком»" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Удалить" }).click();
  // Плеер закрывается на следующей отрисовке после удаления набора — ждём, а не смотрим в тот же миг.
  check("набор удалён — плеер закрылся", await mini.waitFor({ state: "hidden", timeout: 3000 }).then(() => true, () => false));

  // Ответы в обучении по-прежнему не трогают тренировку на главной; блок настроек цел.
  await page.goto(t.url);
  await page.getByRole("heading", { name: "Тренажёр" }).waitFor();
  await openSettings(page);
  check("приложение работает дальше", await visible(page.getByRole("heading", { name: "Настройка тренировки" })));
  await context.close();
  await offline(t, wav);
}

/**
 * Аудио на телефоне — с настоящим Service Worker'ом: скачать курс, слушать без сети с перемоткой, удалить аудио
 * курса (общий с другим курсом файл остаётся), уборка после обновления и удаления набора и при запуске.
 */
async function offline(t, wav) {
  const { check, visible } = t;
  const AUDIO = `${BASE}audio/`;
  const courseYaml = (first) => `title: Курс офлайн
lessons:
  - id: a
    title: Урок А
    audio: audio/${first}
    body: Текст урока А.
  - id: b
    title: Урок Б
    audio: audio/shared.wav
    body: Текст урока Б.
questions:
  - id: q
    level: junior
    question: Вопрос
    options:
      - text: да
        correct: true
      - text: нет
`;
  const files = {
    "course.yaml": courseYaml("a.wav"),
    "second.yaml": courseYaml("a.wav").replace("Курс офлайн", "Второй курс").replace(/  - id: a[\s\S]*?(?=  - id: b)/, ""),
  };
  const context = await t.newContext();
  // Подставные ответы Playwright отдаёт и в режиме «без сети», поэтому сеть «выключаем» сами: с выключенной
  // сетью перехватчик рвёт соединение, и звук без сети может прийти только из памяти телефона.
  let networkDown = false;
  const setNetwork = async (up) => {
    networkDown = !up;
    await context.setOffline(!up);
  };
  // CORS на всех ответах — как у GitHub: без него файл не скачать на телефон.
  await context.route(`${BASE}**`, (route) => {
    if (networkDown) return route.abort("internetdisconnected");
    const request = route.request();
    const name = new URL(request.url()).pathname.split("/main/")[1];
    const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Expose-Headers": "Content-Length" };
    if (files[name]) return route.fulfill({ status: 200, contentType: "text/plain; charset=utf-8", headers: cors, body: files[name] });
    if (!name.startsWith("audio/")) return route.fulfill({ status: 404 });
    if (request.method() === "HEAD") {
      return route.fulfill({ status: 200, contentType: "audio/wav", headers: { ...cors, "Content-Length": String(wav.length) }, body: "" });
    }
    const range = /bytes=(\d+)-(\d*)/.exec(request.headers().range ?? "");
    if (!range) return route.fulfill({ status: 200, contentType: "audio/wav", headers: { ...cors, "Accept-Ranges": "bytes", Vary: "Accept-Encoding, Origin" }, body: wav });
    const start = Number(range[1]);
    const end = range[2] ? Number(range[2]) : wav.length - 1;
    return route.fulfill({
      status: 206,
      contentType: "audio/wav",
      headers: { ...cors, "Accept-Ranges": "bytes", "Content-Range": `bytes ${start}-${end}/${wav.length}` },
      body: wav.subarray(start, end + 1),
    });
  });
  const page = await context.newPage();
  const mini = page.getByRole("button", { name: /^Плеер урока «/ });
  const sheet = page.getByRole("dialog", { name: "Плеер урока" });
  const turnOff = async () => {
    if (!(await sheet.isVisible())) await mini.click();
    await sheet.getByRole("button", { name: "Выключить плеер" }).click();
  };
  const stored = () =>
    page.evaluate(async () => (await (await caches.open("lesson-audio")).keys()).map((r) => r.url.split("/").pop()).sort());
  const home = async () => {
    await page.goto(t.url);
    await page.getByRole("heading", { name: "Тренажёр" }).waitFor();
  };
  const openCourse = async (title) => {
    await page.getByRole("button", { name: /Свои наборы/ }).click();
    await page.getByRole("button", { name: new RegExp(`^${title}`) }).first().click();
    await page.getByRole("button", { name: "Оглавление", exact: true }).click();
    await page.getByRole("heading", { name: "Оглавление" }).waitFor();
  };
  const addSet = async (name) => {
    await page.getByRole("textbox", { name: "Ссылка на YAML-файл" }).fill(`${BASE}${name}`);
    await page.getByRole("button", { name: "Добавить", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "Добавлен" }).first().waitFor();
  };
  const audioCard = page.locator("section", { hasText: "Аудио курса" });

  await home();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await home();
  await page.getByRole("button", { name: /Свои наборы/ }).click();
  await addSet("course.yaml");
  await addSet("second.yaml");
  await home();

  // Скачать курс: размер заранее, прогресс, «Аудио на телефоне».
  await openCourse("Курс офлайн");
  const downloadButton = audioCard.getByRole("button", { name: /^Скачать аудио/ });
  await page.waitForFunction(() => /Скачать аудио · /.test(document.body.innerText), null, { timeout: 5000 }).catch(() => undefined);
  check("в оглавлении «Скачать аудио» с размером", /Скачать аудио · 1,2 МБ/.test(await downloadButton.innerText()), await downloadButton.innerText());
  await t.shot(page, "course-before-download");
  await downloadButton.click();
  await audioCard.getByText("Аудио на телефоне").waitFor({ timeout: 10000 });
  check("скачано: оба файла курса на телефоне", JSON.stringify(await stored()) === JSON.stringify(["a.wav", "shared.wav"]), JSON.stringify(await stored()));
  check("у уроков — «аудио на телефоне»", (await page.locator("main li").filter({ hasText: "аудио на телефоне" }).count()) === 2);
  await t.shot(page, "course-downloaded");
  await page.getByRole("button", { name: "Назад" }).click();
  await page.getByRole("button", { name: "Назад" }).click();
  await page.getByRole("button", { name: "Назад" }).click();
  await page.getByRole("button", { name: "Кабинет" }).click();
  check("в кабинете — сколько места занимает аудио", await visible(page.getByText(/Аудио уроков на телефоне — 1,2 МБ/)));

  // Без сети: урок играет с телефона, перемотка работает.
  await setNetwork(false);
  await home();
  await openCourse("Курс офлайн");
  await page.getByRole("button", { name: /Урок А/ }).click();
  await page.getByRole("button", { name: "Слушать урок" }).click();
  const playedOffline = await page
    .waitForFunction(() => document.querySelector("audio").currentTime > 0.5, null, { timeout: 5000 })
    .then(() => true, () => false);
  check("без сети скачанный урок играет", playedOffline);
  await page.evaluate(() => (document.querySelector("audio").currentTime = 30));
  await page.waitForTimeout(800);
  const afterSeek = await page.evaluate(() => ({ time: document.querySelector("audio").currentTime, paused: document.querySelector("audio").paused }));
  check("без сети перемотка работает", afterSeek.time >= 30 && !afterSeek.paused, JSON.stringify(afterSeek));
  await turnOff();
  await setNetwork(true);

  // «Удалить аудио»: файл, общий со вторым курсом, остаётся.
  await page.getByRole("button", { name: "Оглавление" }).click();
  await audioCard.getByRole("button", { name: "Удалить аудио" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Удалить" }).click();
  await page.waitForTimeout(300);
  check("«Удалить аудио» стёр файлы курса, общий с другим курсом — остался", JSON.stringify(await stored()) === JSON.stringify(["shared.wav"]), JSON.stringify(await stored()));
  // Общий файл остался на телефоне — курс скачан частично, кнопка — «Докачать».
  check("после удаления — «Докачать»: общий файл уже на телефоне", await visible(audioCard.getByRole("button", { name: /^Докачать/ })));
  check("курс и уроки на месте", await visible(page.getByRole("button", { name: /Урок А/ })));

  // Без сети и без скачанного файла — честное сообщение.
  await setNetwork(false);
  await page.getByRole("button", { name: /Урок А/ }).click();
  // Урок уже слушали до 30-й секунды — кнопка предлагает продолжить. Пока открывалась шторка «выключить»,
  // звук мог доиграть до 0:31.
  await page.getByRole("button", { name: /^Продолжить слушать · с 0:3\d/ }).click();
  const offlineDot = await page
    .waitForFunction(() => /: ошибка$/.test(document.querySelector('[aria-label^="Плеер урока «"]')?.getAttribute("aria-label") ?? ""), null, { timeout: 8000 })
    .then(() => true, () => false);
  check("без сети нескачанный урок: на значке — ошибка", offlineDot);
  await mini.click();
  check("в плеере — «Нет сети, а аудио этого урока не скачано»", await visible(sheet.getByText("Нет сети, а аудио этого урока не скачано")));
  await t.shot(page, "offline-not-downloaded");
  // Сеть вернулась — «играть» в плеере грузит файл заново и продолжает с 0:30.
  await setNetwork(true);
  await sheet.getByRole("button", { name: "Слушать" }).click();
  const retried = await page
    .waitForFunction(() => document.querySelector("audio").currentTime >= 30.3 && !document.querySelector("audio").paused, null, { timeout: 8000 })
    .then(() => true, () => false);
  check("сеть вернулась — «играть» продолжает с того же места", retried, JSON.stringify(await page.evaluate(() => document.querySelector("audio").currentTime)));
  await turnOff();

  // Обновили курс, у урока А новая озвучка: старый файл уходит.
  await page.getByRole("button", { name: "Оглавление" }).click();
  await audioCard.getByRole("button", { name: /^Докачать/ }).click();
  await audioCard.getByText("Аудио на телефоне").waitFor({ timeout: 10000 });
  files["course.yaml"] = courseYaml("a-v2.wav");
  await page.getByRole("button", { name: "Назад" }).click();
  await page.getByRole("button", { name: "Обновить набор" }).click();
  await page.getByText(/Набор обновлён/).waitFor();
  await page.waitForTimeout(500);
  check("переозвучка: старый файл стёрт, общий остался", JSON.stringify(await stored()) === JSON.stringify(["shared.wav"]), JSON.stringify(await stored()));

  // Мусор с прошлого запуска (оборванная загрузка, старая версия) уходит при запуске.
  await page.evaluate((url) => caches.open("lesson-audio").then((c) => c.put(url, new Response("x"))), `${AUDIO}orphan.wav`);
  await home();
  await page.waitForTimeout(800);
  check("при запуске лишнее аудио стёрто", JSON.stringify(await stored()) === JSON.stringify(["shared.wav"]), JSON.stringify(await stored()));

  // Удалили оба курса — на телефоне не осталось ничего.
  await page.getByRole("button", { name: /Свои наборы/ }).click();
  for (const title of ["Курс офлайн", "Второй курс"]) {
    await page.getByRole("button", { name: `Удалить «${title}»` }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Удалить" }).click();
    await page.waitForTimeout(300);
    if (title === "Курс офлайн") check("удалили курс — общий файл ещё нужен второму", JSON.stringify(await stored()) === JSON.stringify(["shared.wav"]), JSON.stringify(await stored()));
  }
  await page.waitForTimeout(300);
  check("удалили все курсы — аудио на телефоне не осталось", (await stored()).length === 0, JSON.stringify(await stored()));
  await context.close();
}
