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

  // Прямая ссылка на инструкцию: сначала пароль, потом нужный раздел.
  const direct = await t.newContext({ login: false });
  const p = await direct.newPage();
  await p.goto(`${t.url}#help-sets`);
  await p.getByLabel("Пароль").fill(password);
  await p.getByRole("button", { name: "Войти" }).click();
  check("#help-sets после входа открывает раздел", await visible(p.getByRole("heading", { name: "Свои наборы вопросов" }), 8000));
  await direct.close();
}
