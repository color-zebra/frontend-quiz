// Каталог готовых наборов на экране «Мои наборы»: добавление по кнопке, «Открыть», нет сети, набор, добавленный
// вручную по ссылке на страницу файла, удаление, сворачивание и его запоминание. Пункты — из custom-sets/catalog.yaml.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { load } from "js-yaml";
import { ROOT_DIR, readConfig } from "./lib.mjs";

const SET_FORMS = ["набор", "набора", "наборов"];

function plural(n, forms) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

export default async function catalog(t) {
  const { check, visible } = t;
  const setsDir = join(ROOT_DIR, "custom-sets");
  const repoPath = new URL(readConfig("REPO_URL")).pathname;
  // Наборы этого репозитория (ссылка на raw-файл в custom-sets/) тест отдаёт вместо GitHub из локальных файлов,
  // название у них — из файла. У набора из другого места название — из каталога.
  const entries = load(readFileSync(join(setsDir, "catalog.yaml"), "utf8")).map(({ url, title }) => {
    const { hostname, pathname } = new URL(url);
    const file = hostname === "raw.githubusercontent.com" && pathname.match(/\/custom-sets\/([\w.-]+\.ya?ml)$/)?.[1];
    const path = pathname.replace(`${repoPath}/refs/heads/`, `${repoPath}/`);
    if (!file || !path.startsWith(`${repoPath}/main/`) || !existsSync(join(setsDir, file))) return { url, title };
    const yaml = readFileSync(join(setsDir, file), "utf8");
    return { url, file, path, yaml, title: load(yaml).title };
  });
  const total = entries.length;
  const totalText = `${total} ${plural(total, SET_FORMS)}`;
  const local = entries.filter((e) => e.file);
  const [first, second] = local;

  let offline = false;
  let delay = 0;
  const context = await t.newContext({ serviceWorkers: "block" });
  await context.route("https://raw.githubusercontent.com/**", async (route) => {
    if (offline) return route.abort("internetdisconnected");
    const path = new URL(route.request().url()).pathname.replace(`${repoPath}/refs/heads/`, `${repoPath}/`);
    const entry = local.find((e) => e.path === path);
    if (!entry) return route.fulfill({ status: 404, body: "404: Not Found" });
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    return route.fulfill({ status: 200, contentType: "text/plain; charset=utf-8", body: entry.yaml });
  });

  const page = await context.newPage();
  const openSets = async () => {
    await page.goto(t.url);
    await page.getByText("Что тренируем?").waitFor();
    await page.getByRole("button", { name: /Мои наборы/ }).click();
    await page.getByRole("heading", { name: "Мои наборы" }).waitFor();
  };
  const summary = page.locator("summary", { hasText: "Готовые наборы" });
  // Карточка пункта — свой <details>; её шапка — название и цифры, внутри — описание и кнопка.
  const card = (entry) => page.locator("li > details").filter({ has: page.getByText(entry.title, { exact: true }) });
  const cardHead = (entry) => card(entry).locator("summary");
  const addedMark = (entry) => cardHead(entry).getByText("добавлен ·");
  // После раскрытия ждём поворот стрелки (0,2 с), чтобы на скриншоте она стояла как надо.
  const settle = () => page.waitForTimeout(300);
  const expand = async (entry) => {
    if (!(await card(entry).evaluate((el) => el.open))) await cardHead(entry).click();
    await settle();
  };
  const collapse = async (entry) => {
    if (await card(entry).evaluate((el) => el.open)) await cardHead(entry).click();
    await settle();
  };
  const addButton = (entry) => page.getByRole("button", { name: `Добавить «${entry.title}»` });
  const openButton = (entry) => page.getByRole("button", { name: `Открыть «${entry.title}»` });

  await openSets();
  check("каталог на экране наборов", await visible(summary));
  check(`в шапке — сколько наборов: «${totalText}»`, await visible(summary.getByText(totalText, { exact: true })));
  check("в первый раз каталог раскрыт", await visible(cardHead(first)));
  let allListed = true;
  for (const entry of entries) allListed &&= await visible(cardHead(entry));
  check("у каждого пункта каталога — своя карточка", allListed, entries.map((e) => e.title).join(", "));
  check("карточки свёрнуты: описания и кнопки не видно", !(await addButton(first).isVisible()));
  check("ни одна карточка не помечена «добавлен»", (await page.getByText("добавлен ·").count()) === 0);
  check(
    "каталог стоит под «Добавить набор»",
    await page.evaluate(() => {
      const form = [...document.querySelectorAll("section")].find((s) => s.textContent?.includes("Добавить набор"));
      const catalogCard = document.querySelector("details");
      return !!form && !!catalogCard && !!(form.compareDocumentPosition(catalogCard) & Node.DOCUMENT_POSITION_FOLLOWING);
    }),
  );
  check("пустой список своих наборов", await visible(page.getByText("Наборов пока нет.")));
  await t.shot(page, "open", true);

  await expand(first);
  check("раскрытая карточка — описание и «Добавить»", await visible(addButton(first)));
  await t.shot(page, "expanded");

  // Нет сети — понятная ошибка под пунктом, набор не добавлен.
  offline = true;
  await addButton(first).click();
  check("нет сети — ошибка про интернет", await visible(page.getByText(/^Не удалось скачать набор — похоже, нет интернета/)));
  check("после ошибки снова «Добавить»", await visible(addButton(first)));
  await t.shot(page, "offline");

  // Загрузка: пока файл качается, кнопка говорит «Загружаем…».
  offline = false;
  delay = 1500;
  await addButton(first).click();
  check("идёт загрузка — «Загружаем…»", await visible(addButton(first).getByText("Загружаем…"), 1000));
  check("ошибка ушла при новой попытке", (await page.getByText(/^Не удалось скачать набор/).count()) === 0);
  await t.shot(page, "loading");
  delay = 0;
  check("набор добавлен — кнопка стала «Открыть»", await visible(openButton(first)));
  check("в шапке — сколько уже у тебя", await visible(summary.getByText(`${totalText} · ${total === 1 ? "все уже у тебя" : "1 уже у тебя"}`)));
  check("набор появился в списке своих", await visible(page.getByRole("button", { name: `Обновить «${first.title}»` })));
  check("при удачной загрузке лишних сообщений нет", (await page.getByRole("status").count()) === 0);
  check("над своими наборами — подпись «Добавленные · 1»", await visible(page.getByText("Добавленные · 1")));
  await t.shot(page, "added-open");
  await collapse(first);
  check("и в свёрнутой карточке видно «добавлен»", await visible(addedMark(first)));
  await t.shot(page, "added", true);

  await expand(first);
  await openButton(first).click();
  check("«Открыть» ведёт на экран набора", await visible(page.getByRole("heading", { name: first.title })));
  await page.getByRole("button", { name: "Назад" }).click();

  // Набор, добавленный вручную по ссылке на страницу файла (без refs/heads), каталог узнаёт и второй раз не предлагает.
  if (second) {
    await page.getByRole("textbox", { name: "Ссылка на YAML-файл" }).fill(
      `https://github.com${repoPath}/blob/main/custom-sets/${second.file}`,
    );
    await page.getByRole("button", { name: "Добавить", exact: true }).click();
    await page.getByText(`Добавлен «${second.title}»`).waitFor();
    check("набор по ссылке на страницу файла каталог узнал — «добавлен»", await visible(addedMark(second)));
    await expand(second);
    check("и внутри — «Открыть»", await visible(openButton(second)));
    await collapse(second);
  }

  // Удалили набор — карточка снова обычная, внутри «Добавить».
  await page.getByRole("button", { name: `Удалить «${first.title}»` }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Удалить" }).click();
  await expand(first);
  check("после удаления в каталоге снова «Добавить»", await visible(addButton(first)));
  check("и пометки «добавлен» нет", !(await addedMark(first).isVisible()));

  // Свернуть каталог: остаётся одна строка, после перезапуска он по-прежнему свёрнут.
  await summary.click();
  check("свёрнутый каталог прячет карточки", !(await cardHead(first).isVisible()));
  await openSets();
  check("каталог помнит, что свёрнут", (await visible(summary)) && !(await cardHead(first).isVisible()));
  await t.shot(page, "collapsed");
  await summary.click();
  await settle();
  check("раскрывается снова", await visible(cardHead(first)));

  // Узкий телефон: свёрнутые карточки — название в одну строку с троеточием, раскрытая — целиком.
  await page.setViewportSize({ width: 320, height: 760 });
  const isOneLine = (entry) =>
    cardHead(entry)
      .getByText(entry.title, { exact: true })
      .evaluate((el) => el.getBoundingClientRect().height < parseFloat(getComputedStyle(el).fontSize) * 1.9);
  let oneLine = true;
  for (const entry of entries) oneLine &&= await isOneLine(entry);
  check("на узком экране свёрнутые карточки — название в одну строку", oneLine);
  const longest = entries.reduce((a, b) => (b.title.length > a.title.length ? b : a));
  await expand(longest);
  check("раскрытая карточка показывает длинное название целиком", !(await isOneLine(longest)), longest.title);
  await collapse(longest);
  await expand(first);
  await t.shot(page, "320", true);

  // Тема «Терминал»: свой шрифт и «// » у заголовков карточек.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => localStorage.setItem("fq.theme", "terminal"));
  await openSets();
  await t.shot(page, "terminal", true);

  await context.close();
}
