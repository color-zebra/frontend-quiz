import clsx from "clsx";
import ReactMarkdown, { type Components } from "react-markdown";
import styles from "./Markdown.module.css";

// Тексты вопросов используют только `код` и **жирный**. Остальное разворачивается в простой текст,
// а HTML внутри текста react-markdown не исполняет — это важно для чужих наборов вопросов.
const ALLOWED = ["p", "strong", "em", "code", "a", "br"];

const blockComponents: Components = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
};

const inlineComponents: Components = {
  ...blockComponents,
  p: ({ children }) => <>{children}</>,
};

interface MarkdownProps {
  text: string;
  /** Строчный режим: без абзацев, для вариантов ответа и коротких подписей. */
  inline?: boolean;
  className?: string;
}

export function Markdown({ text, inline = false, className }: MarkdownProps) {
  const content = (
    <ReactMarkdown allowedElements={ALLOWED} unwrapDisallowed components={inline ? inlineComponents : blockComponents}>
      {text}
    </ReactMarkdown>
  );
  if (inline) return <span className={clsx(styles.md, className)}>{content}</span>;
  return <div className={clsx(styles.md, styles.block, className)}>{content}</div>;
}
