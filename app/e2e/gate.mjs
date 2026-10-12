// Экран пароля: до входа приложение не грузится, неверный пароль, вход, запоминание, смена пароля, прямая ссылка.
// Пароль берётся из локального .access-password; нет файла или пароль не задан — набор пропускается.
import { getAccessHash, readLocalPassword } from "./lib.mjs";

export default async function gate(t) {
  const { check, visible } = t;
  if (!getAccessHash()) return t.info("пароль на вход не задан — экран пароля не проверяется");
  const password = readLocalPassword();
  if (!password) return t.info("нет файла .access-password в корне — экран пароля не проверяется");

  const context = await t.newContext({ login: false });
  const page = await context.newPage();
  let questionRequests = 0;
  page.on("request", (request) => request.url().includes("questions.json") && questionRequests++);

  await page.goto(t.url);
  const field = page.getByLabel("Пароль");
  check("при первом открытии — экран пароля", await visible(field));
  await page.waitForTimeout(500);
  check("до входа база не скачивается", questionRequests === 0, `запросов: ${questionRequests}`);
  check("до входа приложения не видно", !(await page.getByText("Что тренируем?").isVisible()));
  await t.shot(page, "screen");

  await field.fill("неправильный");
  await page.getByRole("button", { name: "Войти" }).click();
  check("неверный пароль — сообщение", await visible(page.getByText("Неверный пароль")));
  await field.fill(`  ${password} `);
  check("сообщение пропадает при вводе", !(await page.getByText("Неверный пароль").isVisible()));
  await page.keyboard.press("Enter");
  check("верный пароль (с пробелами по краям) — вход", await visible(page.getByText("Что тренируем?"), 8000));

  await page.reload();
  check("после перезагрузки пароль не спрашивается", await visible(page.getByText("Что тренируем?"), 8000));

  await page.evaluate(() => localStorage.setItem("fq.access", "старый-отпечаток"));
  await page.reload();
  check("после смены пароля — снова экран входа", await visible(field));
  await context.close();

  // Инструкция открыта и без пароля; база при этом не скачивается.
  const direct = await t.newContext({ login: false });
  const p = await direct.newPage();
  let helpRequests = 0;
  p.on("request", (request) => request.url().includes("questions.json") && helpRequests++);
  await p.goto(`${t.url}#help-sets`);
  check("#help-sets без пароля открывает инструкцию про наборы", await visible(p.getByRole("heading", { name: "Свои наборы вопросов" }), 8000));
  // Раздел раскрываем: в свёрнутом кнопку не найти, и проверка засчиталась бы сама собой.
  await p.getByText("Попробовать на готовом примере").click();
  const example = p.locator("details", { hasText: "Попробовать на готовом примере" });
  check(
    "без пароля «Мои наборы» в инструкции — текст, а не кнопка",
    (await visible(example.getByText("«Мои наборы»", { exact: true }))) && (await example.getByRole("button", { name: "«Мои наборы»" }).count()) === 0,
  );
  await p.getByRole("button", { name: "Назад" }).click();
  check("«Назад» из инструкции — экран пароля", await visible(p.getByLabel("Пароль")));
  check("метка #help-sets убрана из адреса", !p.url().includes("#"), p.url());

  await p.getByRole("button", { name: "Что это за приложение?" }).click();
  check("ссылка с экрана пароля открывает инструкцию", await visible(p.getByRole("heading", { name: "Как пользоваться" })));
  await p.getByText("Свои наборы вопросов", { exact: true }).click();
  await p.getByRole("button", { name: "отдельная инструкция про свои наборы" }).click();
  check("переход к инструкции про наборы и без пароля", await visible(p.getByRole("heading", { name: "Свои наборы вопросов" })));
  await p.goBack();
  check("системный «назад» — снова общая инструкция", await visible(p.getByRole("heading", { name: "Как пользоваться" })));
  await p.goBack();
  check("ещё раз «назад» — экран пароля, а не уход с сайта", await visible(p.getByLabel("Пароль")));
  check("пока читали инструкцию, база не скачивалась", helpRequests === 0, `запросов: ${helpRequests}`);
  await t.shot(p, "help-link");

  await p.getByLabel("Пароль").fill(password);
  await p.getByRole("button", { name: "Войти" }).click();
  check("после входа — главная", await visible(p.getByText("Что тренируем?"), 8000));
  await direct.close();
}
