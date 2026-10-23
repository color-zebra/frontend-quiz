// Стиль CSS проверяет только одно правило: размер шрифта — из шкалы в src/styles/themes.css.
// Запускается в сборке приложения (pnpm build) и отдельно: pnpm lint:css.
/** @type {import("stylelint").Config} */
export default {
  rules: {
    "declaration-property-value-allowed-list": [
      {
        // Переменная шкалы; em — строчный код, растущий вместе с текстом вокруг; inherit.
        "font-size": ["/^var\\(--font-size-(caption|hint|small|body|heading|display)\\)$/", "/^[\\d.]+em$/", "inherit"],
      },
      {
        message: (property, value) =>
          `Размер шрифта «${value}» вне шкалы: возьми переменную --font-size-* из src/styles/themes.css ` +
          `(или добавь ступень в шкалу по договорённости с автором)`,
      },
    ],
  },
};
