import type { MouseEvent } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { CodeLang } from "../../data/types";
import { CodeBlock } from "../../shared/ui/code/CodeBlock";
import { MarkdownImage } from "../../shared/ui/MarkdownImage";
import styles from "./LessonMarkdown.module.css";

/*
 * Текст урока — богаче текста вопроса: заголовки, таблицы, цитаты, блоки кода (картинки — те же, что в вопросах).
 * Это отдельный компонент: общий Markdown рисует и варианты ответа в одну строку, таблица или список там сломали бы
 * вёрстку.
 * Уроки приходят по чужим ссылкам, поэтому HTML в тексте не исполняется — react-markdown показывает его как текст,
 * а адреса вроде javascript: вырезает сам.
 */

/** Язык после ``` → язык подсветки. Незнакомый показывается без подсветки. */
const FENCE_LANGS: Record<string, CodeLang | "yaml"> = {
  js: "js",
  javascript: "js",
  mjs: "js",
  cjs: "js",
  ts: "ts",
  typescript: "ts",
  jsx: "jsx",
  tsx: "tsx",
  html: "html",
  xml: "html",
  svg: "html",
  vue: "html",
  css: "css",
  scss: "scss",
  json: "json",
  http: "http",
  yaml: "yaml",
  yml: "yaml",
};

/** Узел дерева, из которого react-markdown рисует элемент, — нужен только текст и класс языка у кода. */
interface TreeNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: { className?: unknown };
  children?: TreeNode[];
}

function getText(node: TreeNode): string {
  return node.type === "text" ? (node.value ?? "") : (node.children ?? []).map(getText).join("");
}

function getFenceLang(code: TreeNode | undefined) {
  const classes = Array.isArray(code?.properties?.className) ? (code.properties.className as unknown[]) : [];
  const name = classes.map(String).find((c) => c.startsWith("language-"))?.slice("language-".length).toLowerCase();
  return (name && FENCE_LANGS[name]) || "text";
}

/**
 * Ссылка внутри урока (сноска, «#раздел»). Переход по якорю добавил бы запись в историю браузера, и стек экранов
 * принял бы её за «Назад» — человека выкинуло бы на главную. Поэтому просто прокручиваем к месту.
 */
function scrollToAnchor(e: MouseEvent<HTMLAnchorElement>, href: string) {
  e.preventDefault();
  const id = decodeURIComponent(href.slice(1));
  const target = document.getElementById(id) ?? document.getElementById(`user-content-${id}`);
  target?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function getComponents(baseUrl: string | undefined): Components {
  return {
    // У урока уже есть заголовок экрана, поэтому «#» в тексте — это раздел урока, как «##».
    h1: ({ children }) => <h2>{children}</h2>,
    h5: ({ children }) => <h4>{children}</h4>,
    h6: ({ children }) => <h4>{children}</h4>,
    // Адрес вроде javascript: react-markdown вырезает — остаётся просто текст, а не ссылка на само приложение.
    a: ({ href, children }) =>
      !href ? (
        <>{children}</>
      ) : href.startsWith("#") ? (
        <a href={href} onClick={(e) => scrollToAnchor(e, href)}>
          {children}
        </a>
      ) : (
        <a href={href} target="_blank" rel="noreferrer">
          {children}
        </a>
      ),
    blockquote: ({ children }) => <blockquote className={styles.note}>{children}</blockquote>,
    // Блок кода — той же подсветкой и с той же кнопкой переноса, что код в вопросах.
    pre: ({ node }) => {
      const code = (node as TreeNode | undefined)?.children?.find((child) => child.tagName === "code");
      return <CodeBlock code={code ? getText(code) : ""} lang={getFenceLang(code)} />;
    },
    // Широкая таблица прокручивается вбок внутри своей рамки, а не тянет за собой весь экран.
    table: ({ children }) => (
      <div className={styles.tableWrap} tabIndex={0} role="region" aria-label="Таблица">
        <table>{children}</table>
      </div>
    ),
    img: ({ src, alt, title }) => (
      <MarkdownImage src={typeof src === "string" ? src : undefined} alt={alt} title={title} baseUrl={baseUrl} />
    ),
  };
}

interface LessonMarkdownProps {
  text: string;
  /** Ссылка набора: от неё разрешаются относительные пути картинок. Нет у набора из файла. */
  baseUrl?: string;
}

export function LessonMarkdown({ text, baseUrl }: LessonMarkdownProps) {
  return (
    <div className={styles.lesson}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        // Сноски [^1]: подпись по-русски и видимая — по умолчанию она английская и только для экранных чтецов.
        remarkRehypeOptions={{
          footnoteLabel: "Примечания",
          footnoteLabelTagName: "h4",
          footnoteLabelProperties: {},
          footnoteBackLabel: "Вернуться к тексту",
        }}
        components={getComponents(baseUrl)}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
