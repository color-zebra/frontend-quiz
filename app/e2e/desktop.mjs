// Десктопная раскладка (от 1024 px): боковое меню с разделами и «Моими курсами», «Курсы» с «Продолжить» и рядами,
// «Все курсы» с дорожкой серии и «Показать все», страница курса, урок с планом и соседними уроками, тест без меню
// с дорожкой сессии и клавишами. На 1023 px — прежняя телефонная вёрстка с переключателем разделов.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT_DIR } from "./lib.mjs";

export default async function desktop(t) {
  const { check, visible } = t;
  const setsDir = join(ROOT_DIR, "custom-sets");
  const context = await t.newContext({ serviceWorkers: "block", section: "courses", viewport: { width: 1440, height: 900 } });
  await context.route("https://raw.githubusercontent.com/**", (route) => {
    const file = new URL(route.request().url()).pathname.split("/custom-sets/")[1];
    const path = file && join(setsDir, file);
    if (!path || !existsSync(path)) return route.fulfill({ status: 404, body: "404: Not Found" });
    return route.fulfill({ status: 200, contentType: "text/plain; charset=utf-8", body: readFileSync(path, "utf8") });
  });
  await context.route("https://color-zebra.github.io/frontend-quiz-audio/**", (route) => route.abort());
  const page = await context.newPage();
  const button = (name, options = {}) => page.getByRole("button", { name, ...options });
  const menu = page.getByRole("navigation", { name: "Разделы" });

  // Оболочка: меню слева вместо переключателя под заголовком.
  await page.goto(t.url);
  await page.getByRole("heading", { level: 1, name: "Курсы", exact: true }).waitFor();
  check("боковое меню с тремя разделами", (await menu.getByRole("button").count()) === 3);
  check("в меню выбран «Курсы»", (await menu.getByRole("button", { name: "Курсы" }).getAttribute("aria-current")) === "page");
  check("справка — внизу меню, кнопки «Помощь» у заголовка нет", (await visible(button("Справка"))) && !(await visible(button("Помощь"), 300)));
  await t.shot(page, "desktop-first-run");

  // Все курсы: дорожка серии, раздел отдельных курсов одним рядом и «Показать все» — раскрытие на месте.
  await button(/^Все курсы/).first().click();
  await page.getByRole("heading", { level: 1, name: "Все курсы" }).waitFor();
  const track = page.getByRole("region", { name: /^Серия/ });
  check("серия — дорожка из семи шагов", (await track.locator("ol > li").count()) === 7);
  const single = page.getByRole("region", { name: "Отдельные курсы" });
  const tiles = () => single.locator("button").filter({ hasNot: page.getByText(/Показать все|Свернуть/) }).count();
  const more = single.getByRole("button", { name: /^Показать все/ });
  if (await visible(more, 500)) {
    const before = await tiles();
    await more.click();
    check("«Показать все» раскрывает раздел на месте", (await tiles()) > before && (await visible(single.getByRole("button", { name: /^Свернуть/ }))));
  } else {
    check("отдельные курсы помещаются в один ряд — «Показать все» не нужна", (await tiles()) > 0);
  }

  // Начать курс: страница до скачивания в десктопной раскладке, урок с тремя колонками.
  await track.getByRole("button", { name: /Основы/ }).click();
  await button("Начать курс").click();
  await page.getByRole("navigation", { name: "Оглавление курса" }).waitFor();
  check("урок: оглавление курса слева", await visible(page.getByRole("navigation", { name: "Оглавление курса" })));
  check("урок: план «В этом уроке» справа", await visible(page.getByRole("navigation", { name: "В этом уроке" })));
  check("урок: следующий урок карточкой", await visible(button(/Урок 2 · дальше/)));
  check("урок: меню сжато в полосу значков", (await visible(menu.getByRole("button", { name: "Тренажёр" }))) && !(await visible(page.getByText("Zubrilka"), 300)));
  check("урок: время чтения в подзаголовке", await visible(page.getByText(/мин чтения/)));
  await t.shot(page, "desktop-lesson");
  await button(/Урок 2 · дальше/).click();
  check("карточка «дальше» открывает следующий урок", await visible(page.getByRole("button", { name: /Урок 1 · назад/ })));

  // Меню: «Мои курсы» ведут на страницу курса, разделы работают из глубины.
  await menu.getByRole("button", { name: "Курсы" }).click();
  await page.getByRole("heading", { level: 1, name: "Курсы", exact: true }).waitFor();
  check("«Продолжить» на главной — урок 2", await visible(page.getByRole("region", { name: "Продолжить" }).getByText(/урок 2 из/)));
  await page.getByRole("region", { name: "Мои курсы" }).first().getByRole("button", { name: /Системный дизайн: основы/ }).click();
  check("«Мои курсы» в меню открывают страницу курса", await visible(page.getByRole("region", { name: "Оглавление" })));
  await t.shot(page, "desktop-course");

  // Тест: без меню, дорожка сессии, вердикт крупно, клавиши.
  await menu.getByRole("button", { name: "Тренажёр" }).click();
  await page.getByRole("heading", { level: 1, name: "Тренажёр" }).waitFor();
  check("тренажёр: темы прямо на странице", await visible(page.getByText("Темы", { exact: true })));
  await button(/^Начать/).click();
  await page.getByText(/^1 \/ \d+$/).waitFor();
  check("тест — без бокового меню", !(await visible(menu, 300)));
  check("кнопка «Завершить» вместо крестика", await visible(button("Завершить")));
  await page.keyboard.press("1");
  check("клавиша 1 отвечает, вердикт крупно", await visible(page.getByRole("status").filter({ hasText: /Верно|Неверно/ })));
  check("подсказка клавиш в панели", await visible(page.locator("kbd", { hasText: "Enter" })));
  await t.shot(page, "desktop-test");
  await page.keyboard.press("Enter");
  check("Enter — следующий вопрос", await visible(page.getByText(/^2 \/ \d+$/)));
  await page.keyboard.press("Escape");
  check("Esc завершает сессию — итог", await visible(page.getByText(/Верно|верно/).first()));

  // Узкое окно: прежняя телефонная вёрстка.
  await page.setViewportSize({ width: 1023, height: 800 });
  await page.goto(t.url);
  await page.getByRole("heading", { level: 1 }).first().waitFor();
  check("1023 px — меню нет, переключатель разделов под заголовком", !(await visible(page.getByText("Zubrilka"), 300)) && (await visible(page.getByRole("navigation", { name: "Разделы" }))));
  await context.close();
}
