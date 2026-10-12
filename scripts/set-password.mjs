// Задаёт пароль на вход в приложение: пишет его SHA-256 в app/src/config.ts. Сам пароль никуда не сохраняется.
// Запуск: pnpm password <пароль>   |   pnpm password --off — вход без пароля
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const CONFIG = join(dirname(fileURLToPath(import.meta.url)), "..", "app", "src", "config.ts");
const LINE = /^export const ACCESS_PASSWORD_HASH = ".*";$/m;

const arg = process.argv.slice(2).join(" ");
if (!arg) {
  console.error("Укажи пароль: pnpm password <пароль>\nВыключить вход по паролю: pnpm password --off");
  process.exit(1);
}

// Пробелы по краям отрезаем так же, как приложение при вводе.
const hash = arg === "--off" ? "" : createHash("sha256").update(arg.trim(), "utf8").digest("hex");
const source = readFileSync(CONFIG, "utf8");
if (!LINE.test(source)) {
  console.error(`Не нашёл строку ACCESS_PASSWORD_HASH в ${CONFIG}`);
  process.exit(1);
}
writeFileSync(CONFIG, source.replace(LINE, `export const ACCESS_PASSWORD_HASH = "${hash}";`));

console.log(
  hash
    ? "Пароль задан. Закоммить app/src/config.ts и запушь — после деплоя приложение спросит пароль."
    : "Вход по паролю выключен. Закоммить app/src/config.ts и запушь.",
);
if (hash) console.log("Кто уже входил со старым паролем, увидит экран входа снова.");
