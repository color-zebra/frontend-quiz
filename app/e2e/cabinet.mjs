// Кабинет: вход с главной, заметки и оформление, резервная копия (заметки + ответы), сброс статистики.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { answerRecord, fileInput, openCabinet, option, question, seedAnswers, withBank } from "./fixtures.mjs";

const four = (id) => [option(`${id}-верно`, true), option(`${id}-нет1`), option(`${id}-нет2`), option(`${id}-нет3`)];

export default async function cabinet(t) {
  const { check, visible } = t;
  const questions = ["q1", "q2", "q3"].map((id) => question(id, `ВОПРОС-${id}`, four(id)));

  await withBank({ questions }, async () => {
    const context = await t.newContext({ serviceWorkers: "block" });
    const page = await context.newPage();
    const statsTile = page.getByRole("button", { name: /^Статистика/ });
    const reset = page.getByRole("button", { name: "Сбросить статистику" });
    const save = page.getByRole("button", { name: "Сохранить копию" });
    const upload = page.locator('input[type="file"]');
    const status = page.getByRole("status");

    await page.goto(t.url);
    await page.getByText("Что тренируем?").waitFor();
    check("на главной — значок кабинета вместо палитры", (await visible(page.getByRole("button", { name: "Кабинет" }))) && !(await page.getByRole("button", { name: "Оформление" }).isVisible()));
    check("заметок и статистики на главной больше нет", !(await page.getByRole("button", { name: /^Мои заметки/ }).isVisible()) && !(await statsTile.isVisible()));

    await openCabinet(page, t.url);
    check("пустой кабинет: копию сохранять нечего", await save.isDisabled());
    check("пустой кабинет: сброса нет", !(await reset.isVisible()));
    await page.getByRole("button", { name: /^Оформление/ }).click();
    check("«Оформление» открывает выбор темы", await visible(page.getByRole("dialog")));
    await page.keyboard.press("Escape");

    // Заметка через сессию и два ответа в ленте.
    await page.goto(t.url);
    await page.getByRole("button", { name: /^Начать/ }).click();
    await page.getByRole("button", { name: "Заметка", exact: true }).click();
    await page.getByRole("textbox").fill("Заметка для копии");
    await page.getByRole("button", { name: "Сохранить" }).click();
    await page.getByRole("button", { name: "Выйти из сессии" }).click();
    await seedAnswers(page, [answerRecord("q1", 1, false), answerRecord("q2", 2, true)]);
    await openCabinet(page, t.url);
    check("в кабинете — «1 заметка»", await visible(page.getByRole("button", { name: /^Мои заметки/ }).getByText("1 заметка")));
    check("статистика в кабинете: «видел 2 из 3 · верных 50 %»", await visible(statsTile.getByText("видел 2 из 3 · верных 50 %")));
    await t.shot(page, "screen", true);

    // Сохраняем копию.
    const downloading = page.waitForEvent("download");
    await save.click();
    const file = join(t.outDir, "cabinet-backup.json");
    await (await downloading).saveAs(file);
    const backup = JSON.parse(readFileSync(file, "utf8"));
    check("в копии и заметка, и ответы", backup.notes.length === 1 && backup.answers.length === 2);

    // Сброс: «Оставить» ничего не трогает, «Сбросить» стирает ответы, но не заметки.
    await reset.click();
    await page.getByRole("dialog").getByRole("button", { name: "Оставить" }).click();
    check("«Оставить» — статистика на месте", await visible(statsTile.getByText("видел 2 из 3 · верных 50 %")));
    await reset.click();
    await t.shot(page, "confirm");
    await page.getByRole("dialog").getByRole("button", { name: "Сбросить" }).click();
    check("после сброса — «ещё нет ответов»", await visible(statsTile.getByText("ещё нет ответов")));
    check("заметки сброс не трогает", await visible(page.getByRole("button", { name: /^Мои заметки/ }).getByText("1 заметка")));
    await page.reload();
    await openCabinet(page, t.url);
    check("сброс пережил перезагрузку", await visible(statsTile.getByText("ещё нет ответов")));

    // Загружаем копию: ответы вернулись; второй раз — ничего не задвоилось.
    await upload.setInputFiles(file);
    check(
      "копия загружена: ответов добавлено 2",
      (await status.innerText()).includes("Ответы: добавлено 2.") && (await visible(statsTile.getByText("видел 2 из 3 · верных 50 %"))),
      await status.innerText(),
    );
    await upload.setInputFiles(file);
    check("повторная загрузка ничего не задвоила", (await status.innerText()).includes("Ответы: добавлено 0."), await status.innerText());
    await page.reload();
    await openCabinet(page, t.url);
    check("загруженные ответы сохранились на устройстве", await visible(statsTile.getByText("видел 2 из 3 · верных 50 %")));

    // Старый файл — одни заметки: загружается, про ответы честно сказано.
    const note = { ...backup.notes[0], text: "Обновлённая заметка", updatedAt: backup.notes[0].updatedAt + 1000 };
    const oldFile = JSON.stringify({ format: "frontend-quiz-notes", version: 1, exportedAt: new Date().toISOString(), notes: [note] });
    writeFileSync(join(t.outDir, "cabinet-old.json"), oldFile);
    await upload.setInputFiles(fileInput("old.json", oldFile));
    check(
      "старая копия с одними заметками загружается",
      (await status.innerText()).includes("обновлено 1") && (await status.innerText()).includes("старая копия с одними заметками"),
      await status.innerText(),
    );
    await upload.setInputFiles(fileInput("other.json", JSON.stringify({ hello: 1 })));
    check("чужой файл — понятная ошибка", (await status.innerText()) === "Это не файл резервной копии Zubrilka");

    await page.getByRole("button", { name: /^Мои заметки/ }).click();
    check("«Мои заметки» открываются из кабинета", await visible(page.getByText("Обновлённая заметка")));
    await context.close();
  });
}
