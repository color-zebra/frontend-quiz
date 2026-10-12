import clsx from "clsx";
import { Highlight, Prism, type PrismTheme } from "prism-react-renderer";
import type { CodeLang } from "../../../data/types";
import glass from "../glass.module.css";
import styles from "./CodeBlock.module.css";
import { PRISM_LANGUAGE } from "./languages";

// Цвета токенов задаёт тема приложения через CSS, поэтому встроенную тему подсветки отключаем.
const NO_THEME: PrismTheme = { plain: {}, styles: [] };

interface CodeBlockProps {
  code: string;
  /** yaml — для примеров в инструкции: в вопросах такого языка нет. */
  lang?: CodeLang | "yaml";
}

export function CodeBlock({ code, lang }: CodeBlockProps) {
  const source = code.replace(/\n+$/, "");
  const language = lang === "yaml" ? "yaml" : lang ? PRISM_LANGUAGE[lang] : null;
  const className = clsx(styles.code, glass.glass);

  if (!language || !Prism.languages[language]) {
    return (
      <pre className={className}>
        <code>{source}</code>
      </pre>
    );
  }

  return (
    <Highlight prism={Prism} code={source} language={language} theme={NO_THEME}>
      {({ tokens, getLineProps, getTokenProps }) => (
        <pre className={className}>
          <code>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, k) => (
                  <span key={k} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </code>
        </pre>
      )}
    </Highlight>
  );
}
