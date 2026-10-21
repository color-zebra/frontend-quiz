// Озвучка уроков: «Слушать урок», мини-плеер на всех экранах, экран блокировки (Media Session), место в аудио
// после перезагрузки, ±15 секунд, скорость, конец урока, мини-плеер не закрывает кнопки, удаление набора.
// Звук — тишина в WAV, собранная здесь же: файлов из репозитория с аудио тесты не знают.
import { openSettings } from "./fixtures.mjs";

const BASE = "https://raw.githubusercontent.com/test/audio/main/";
const SECONDS = 40;

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
${Array.from({ length: 40 }, (_, i) => `      Абзац ${i + 1} урока, чтобы было что прокручивать.\n`).join("\n")}
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
    if (name !== "audio/a.wav") return route.fulfill({ status: 404 });
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
  const player = page.getByRole("region", { name: "Плеер урока" });
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
    await page.getByRole("button", { name: /Мои наборы/ }).click();
    await page.getByRole("button", { name: /^Курс со звуком/ }).first().click();
    await page.getByRole("button", { name: "Оглавление", exact: true }).click();
    await page.getByRole("button", { name: /Урок со звуком/ }).click();
    await page.getByRole("heading", { level: 1, name: "Урок со звуком" }).waitFor();
  };

  await page.goto(t.url);
  await page.getByText("Что тренируем?").waitFor();
  await page.getByRole("button", { name: /Мои наборы/ }).click();
  await page.getByRole("textbox", { name: "Ссылка на YAML-файл" }).fill(`${BASE}course.yaml`);
  await page.getByRole("button", { name: "Добавить", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Добавлен" }).waitFor();
  await page.getByRole("button", { name: "Назад" }).click();
  await openLessonA();

  // Слушать урок.
  check("у урока с аудио — «Слушать урок»", await visible(page.getByRole("button", { name: "Слушать урок" })));
  check("мини-плеера до нажатия нет", !(await player.isVisible()));
  await page.getByRole("button", { name: "Слушать урок" }).click();
  await waitPlaying();
  check("звук пошёл, на уроке — «Пауза»", await visible(page.locator("main").getByRole("button", { name: "Пауза", exact: true })));
  check("мини-плеер с названием урока", (await visible(player)) && (await player.innerText()).includes("Урок со звуком"));
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
  const barBox = await player.boundingBox();
  check("мини-плеер не закрывает кнопки в конце урока", lastButton.y + lastButton.height <= barBox.y, `${lastButton.y + lastButton.height} / ${barBox.y}`);
  await t.shot(page, "lesson-playing");

  // Ушли с урока — звук продолжается.
  await page.getByRole("button", { name: "Назад" }).click();
  await page.getByRole("button", { name: "Назад" }).click();
  await page.getByRole("heading", { level: 1, name: "Курс со звуком" }).waitFor();
  const away = await media();
  check("ушли на экран набора — звук играет, мини-плеер на месте", !away.paused && (await visible(player)), JSON.stringify(away));
  await t.shot(page, "set-home-playing");

  // ±15 секунд и скорость.
  await page.evaluate(() => (document.querySelector("audio").currentTime = 10));
  await player.getByRole("button", { name: "+15 секунд" }).click();
  const forward = (await media()).time;
  await player.getByRole("button", { name: "−15 секунд" }).click();
  const backward = (await media()).time;
  check("+15 и −15 секунд", forward >= 24.5 && forward < 27 && backward >= 9.5 && backward < 12, `${forward} / ${backward}`);
  await player.getByRole("button", { name: "Скорость" }).click();
  check("скорость 1,25×", (await player.getByRole("button", { name: "Скорость" }).innerText()) === "1,25×" && (await media()).rate === 1.25);

  // Пауза — место записано; после перезагрузки урок предлагает продолжить с него.
  await player.getByRole("button", { name: "Пауза" }).click();
  await page.waitForTimeout(300);
  const pausedAt = Math.floor((await media()).time);
  check("пауза: на экране блокировки «на паузе»", (await page.evaluate(() => navigator.mediaSession.playbackState)) === "paused");
  check("пауза: место в аудио записано", (await savedAudio()).a === pausedAt, `${JSON.stringify(await savedAudio())} / ${pausedAt}`);
  await page.reload();
  await page.getByText("Что тренируем?").waitFor();
  check("после перезагрузки мини-плеера нет", !(await player.isVisible()));
  await openLessonA();
  const resume = page.getByRole("button", { name: /^Продолжить слушать · с / });
  check("урок предлагает продолжить с того же места", await visible(resume), await page.locator("main").innerText().then((x) => x.slice(0, 200)));
  await resume.click();
  await waitPlaying();
  const resumed = await media();
  check("продолжил с сохранённой секунды, скорость запомнилась", resumed.time >= pausedAt - 0.5 && resumed.rate === 1.25, JSON.stringify(resumed));

  // Вопросы урока с открытым плеером: нижняя панель над мини-плеером.
  await page.getByRole("button", { name: /К вопросам/ }).click();
  await page.getByText("1 / 1").waitFor();
  const dock = await page.getByRole("button", { name: "Не знаю" }).boundingBox();
  check("в вопросах нижняя панель над мини-плеером", dock.y + dock.height <= (await player.boundingBox()).y);
  await t.shot(page, "quiz-playing");
  await page.goBack();
  await page.getByRole("heading", { level: 1, name: "Урок со звуком" }).waitFor();

  // Конец урока: тишина, место сброшено.
  await page.evaluate((s) => (document.querySelector("audio").currentTime = s - 1), SECONDS);
  await page.waitForFunction(() => document.querySelector("audio").ended, null, { timeout: 5000 });
  await page.waitForTimeout(300);
  check("дослушал — «Урок дослушан», звук остановился", (await visible(player.getByText("Урок дослушан"))) && (await media()).paused);
  check("дослушал — место сброшено, снова «Слушать урок»", (await savedAudio()).a === undefined && (await visible(page.getByRole("button", { name: "Слушать урок" }))));
  await t.shot(page, "ended");

  // Урок без аудио — без кнопки; название в мини-плеере ведёт к уроку, который играет.
  await page.getByRole("button", { name: "Оглавление" }).click();
  await page.getByRole("button", { name: /Урок без звука/ }).click();
  await page.getByRole("heading", { level: 1, name: "Урок без звука" }).waitFor();
  check("у урока без аудио кнопки нет", !(await page.locator("main").getByRole("button", { name: /Слушать|Продолжить слушать/ }).count()));
  await player.getByRole("button", { name: /Урок со звуком/ }).click();
  check("название в мини-плеере открывает урок со звуком", await visible(page.getByRole("heading", { level: 1, name: "Урок со звуком" })));

  // Закрыть плеер — мини-плеер и отступ под него пропадают.
  await player.getByRole("button", { name: "Закрыть плеер" }).click();
  check(
    "«Закрыть плеер» — мини-плеера и отступа под него нет",
    !(await player.isVisible()) && (await page.evaluate(() => document.documentElement.style.getPropertyValue("--audio-bar"))) === "",
  );

  // Удалили набор, пока играет урок, — плеер закрывается.
  // Без перезагрузки: перезагрузка и так заглушила бы звук. Назад по экранам до главной, звук всё это время играет.
  await page.getByRole("button", { name: "Слушать урок" }).click();
  await waitPlaying();
  for (let i = 0; i < 8 && !(await page.getByText("Что тренируем?").isVisible()); i++) {
    await page.goBack();
    await page.waitForTimeout(200);
  }
  await page.getByRole("button", { name: /Мои наборы/ }).click();
  check("перед удалением звук играет", !(await media()).paused && (await player.isVisible()));
  await page.getByRole("button", { name: "Удалить «Курс со звуком»" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Удалить" }).click();
  check("набор удалён — плеер закрылся", !(await player.isVisible()));

  // Ответы в обучении по-прежнему не трогают тренировку на главной; блок настроек цел.
  await page.goto(t.url);
  await page.getByText("Что тренируем?").waitFor();
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
  const player = page.getByRole("region", { name: "Плеер урока" });
  const stored = () =>
    page.evaluate(async () => (await (await caches.open("lesson-audio")).keys()).map((r) => r.url.split("/").pop()).sort());
  const home = async () => {
    await page.goto(t.url);
    await page.getByText("Что тренируем?").waitFor();
  };
  const openCourse = async (title) => {
    await page.getByRole("button", { name: /Мои наборы/ }).click();
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
  await page.getByRole("button", { name: /Мои наборы/ }).click();
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
  await player.getByRole("button", { name: "Закрыть плеер" }).click();
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
  // Урок уже слушали до 30-й секунды — кнопка предлагает продолжить.
  await page.getByRole("button", { name: /^Продолжить слушать · с 0:30/ }).click();
  check("без сети нескачанный урок: «Нет сети, а аудио этого урока не скачано»", await visible(player.getByText("Нет сети, а аудио этого урока не скачано"), 8000));
  await t.shot(page, "offline-not-downloaded");
  // Сеть вернулась — «играть» в плеере грузит файл заново и продолжает с 0:30.
  await setNetwork(true);
  await player.getByRole("button", { name: "Слушать" }).click();
  const retried = await page
    .waitForFunction(() => document.querySelector("audio").currentTime >= 30.3 && !document.querySelector("audio").paused, null, { timeout: 8000 })
    .then(() => true, () => false);
  check("сеть вернулась — «играть» продолжает с того же места", retried, JSON.stringify(await page.evaluate(() => document.querySelector("audio").currentTime)));
  await player.getByRole("button", { name: "Закрыть плеер" }).click();

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
  await page.getByRole("button", { name: /Мои наборы/ }).click();
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
