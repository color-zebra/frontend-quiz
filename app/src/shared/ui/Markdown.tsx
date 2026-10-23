import clsx from "clsx";
import ReactMarkdown, { type Components } from "react-markdown";
import { MarkdownImage } from "./MarkdownImage";
import styles from "./Markdown.module.css";

// Тексты вопросов используют `код`, **жирный**, списки и картинки. Остальное разворачивается в простой текст,
// а HTML внутри текста react-markdown не исполняет — это важно для чужих наборов вопросов.
const ALLOWED = ["p", "strong", "em", "code", "a", "br", "ul", "ol", "li", "img"];
// Варианты ответа и подписи — одна строка: список внутри неё сломал бы вёрстку.
const INLINE_ALLOWED = ALLOWED.filter((tag) => !["ul", "ol", "li"].includes(tag));

function getBlockComponents(baseUrl: string | undefined): Components {
  return {
    a: ({ href, children }) => (
      <a href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    ),
    img: ({ src, alt, title }) => (
      <MarkdownImage src={typeof src === "string" ? src : undefined} alt={alt} title={title} baseUrl={baseUrl} />
    ),
  };
}

const inlineComponents: Components = {
  ...getBlockComponents(undefined),
  // Абзацы в одну строку — через пробел, иначе «Какая заметнее?» и следующий абзац слиплись бы.
  p: ({ children }) => <>{children} </>,
  // В строке картинке нет места: вместо неё описание, чтобы фраза не обрывалась.
  img: ({ alt }) => <span className={styles.imageNote}>{alt ? `картинка: ${alt}` : "картинка"}</span>,
};

interface MarkdownProps {
  text: string;
  /** Строчный режим: без абзацев и картинок, для вариантов ответа и коротких подписей. */
  inline?: boolean;
  /** Ссылка набора: от неё разрешаются относительные пути картинок. Нет у набора из файла. */
  baseUrl?: string;
  className?: string;
}

export function Markdown({ text, inline = false, baseUrl, className }: MarkdownProps) {
  const content = (
    <ReactMarkdown
      allowedElements={inline ? INLINE_ALLOWED : ALLOWED}
      unwrapDisallowed
      components={inline ? inlineComponents : getBlockComponents(baseUrl)}
    >
      {text}
    </ReactMarkdown>
  );
  if (inline) return <span className={clsx(styles.md, className)}>{content}</span>;
  return <div className={clsx(styles.md, styles.block, className)}>{content}</div>;
}
