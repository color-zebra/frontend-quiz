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
}
