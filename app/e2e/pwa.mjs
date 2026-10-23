// PWA: Service Worker, готовность к установке, работа без сети, плашка новой версии.
// На время проверки обновления в dist/sw.js дописывается строка — в конце файл возвращается как был.
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright-core";
import { DIST_DIR, getAccessHash } from "./lib.mjs";

const SW = join(DIST_DIR, "sw.js");

export default async function pwa(t) {
  const { check, visible } = t;
  const total = JSON.parse(readFileSync(join(DIST_DIR, "questions.json"), "utf8")).questions.length;

  // Установка проверяется в обычном профиле: в «инкогнито»-контексте Chrome всегда отвечает, что ставить нельзя.
  const profile = mkdtempSync(join(tmpdir(), "zubrilka-profile-"));
  const persistent = await chromium.launchPersistentContext(profile, { executablePath: t.chrome, viewport: { width: 390, height: 844 } });
  try {
    await persistent.addInitScript((hash) => {
      localStorage.setItem("fq.access", hash);
      localStorage.setItem("fq.section", "trainer");
    }, getAccessHash());
    const page = await persistent.newPage();
    await page.goto(t.url);
    await page.getByRole("heading", { name: "Тренажёр" }).waitFor();
    await page.evaluate(() => navigator.serviceWorker.ready);
    const cdp = await persistent.newCDPSession(page);
    const { installabilityErrors } = await cdp.send("Page.getInstallabilityErrors");
    check("Chrome считает приложение устанавливаемым", installabilityErrors.length === 0, JSON.stringify(installabilityErrors));
    const manifest = await cdp.send("Page.getAppManifest");
    check("манифест найден и без ошибок", !!manifest.url && manifest.errors.length === 0, JSON.stringify(manifest.errors));
  } finally {
    await persistent.close();
  }

  const originalSw = readFileSync(SW, "utf8");
  const context = await t.newContext();
  try {
    const page = await context.newPage();
    await page.goto(t.url);
    await page.getByRole("heading", { name: "Тренажёр" }).waitFor();
    await page.evaluate(() => navigator.serviceWorker.ready);
    // О готовности к работе без сети отдельной плашкой больше не сообщаем: это сказано в подсказке новичку.
    check("плашки «готово работать без интернета» нет", !(await visible(page.getByText("готово работать без интернета"), 1500)));

    await page.reload();
    await page.getByRole("heading", { name: "Тренажёр" }).waitFor();
    check("после перезагрузки страницей управляет Service Worker", await page.evaluate(() => !!navigator.serviceWorker.controller));
    // Демо-страницы курсов — отдельные страницы: SW не должен подменять их приложением.
    await page.goto(new URL("demos/browser/index.html", t.url).href);
    check("демо-страница курса открывается сама, а не приложением", await visible(page.getByRole("heading", { name: "Демо к курсу «Браузер изнутри»" })));
    await page.goto(t.url);
    await page.getByRole("heading", { name: "Тренажёр" }).waitFor();
    await context.setOffline(true);
    await page.reload();
    check("без сети приложение открывается", await visible(page.getByRole("heading", { name: "Тренажёр" })));
    check("без сети база на месте", await visible(page.getByText(new RegExp(`${total} вопрос\\S* · база`))), `${total} вопросов`);
    const fontsOk = await page.evaluate(async () => {
      await document.fonts.ready;
      return document.fonts.check('16px "Manrope Variable"', "Что тренируем");
    });
    check("без сети шрифт с кириллицей загружен", fontsOk);
    await page.getByRole("button", { name: /^Начать/ }).click();
    await page.keyboard.press("0");
    check("без сети сессия работает", await visible(page.getByText("Как это устроено")));
    await page.getByRole("button", { name: "Заметка", exact: true }).click();
    await page.getByRole("textbox").fill("Заметка без сети");
    await page.getByRole("button", { name: "Сохранить" }).click();
    check("без сети заметка сохраняется", await visible(page.getByRole("button", { name: "Изменить заметку" })));
    await t.shot(page, "offline-session");
    await page.getByRole("button", { name: "Выйти из сессии" }).click();
    await page.getByRole("button", { name: "На главную" }).click();
    await page.getByRole("button", { name: "Кабинет" }).click();
    await page.getByRole("button", { name: "Обновить базу" }).click();
    check("«Обновить» без сети — понятная ошибка", await visible(page.getByText("Не удалось обновить: Нет связи с сервером")));
    await context.setOffline(false);

    // Новая версия приложения: меняем sw.js — браузер увидит новый Service Worker при следующей проверке.
    writeFileSync(SW, `${originalSw}\n// новая версия для теста\n`);
    await page.reload();
    const banner = page.getByRole("status").filter({ hasText: "Вышла новая версия" });
    check("строка «Вышла новая версия» под переключателем разделов", await visible(banner, 15000));
    await t.shot(page, "update");
    const navigated = page.waitForEvent("framenavigated", { timeout: 10000 }).then(
      () => true,
      () => false,
    );
    await banner.getByRole("button", { name: "Обновить" }).click();
    check("«Обновить» перезагружает приложение", await navigated);
    await page.getByRole("heading", { name: "Тренажёр" }).waitFor();
    check("после обновления строки нет", !(await visible(page.getByText("Вышла новая версия"), 2000)));
    await page.getByRole("button", { name: "Кабинет" }).click();
    check("заметка пережила обновление", await visible(page.getByText("1 заметка")));
  } finally {
    writeFileSync(SW, originalSw);
    await context.close();
  }
}
