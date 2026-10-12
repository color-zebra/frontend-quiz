import clsx from "clsx";
import { Highlight, Prism, type PrismTheme } from "prism-react-renderer";
import type { ReactNode } from "react";
import type { CodeLang } from "../../../data/types";
import glass from "../glass.module.css";
import { Icon } from "../Icon";
import styles from "./CodeBlock.module.css";
import { toggleCodeWrap, useCodeWrap } from "./codeWrap";
import { PRISM_LANGUAGE } from "./languages";

// Цвета токенов задаёт тема приложения через CSS, поэтому встроенную тему подсветки отключаем.
const NO_THEME: PrismTheme = { plain: {}, styles: [] };

interface CodeBlockProps {
  code: string;
  /** yaml — для примеров в инструкции: в вопросах такого языка нет. */
  lang?: CodeLang | "yaml";
}

export function CodeBlock({ code, lang }: CodeBlockProps) {
  const wrap = useCodeWrap();
  const source = code.replace(/\n+$/, "");
  const language = lang === "yaml" ? "yaml" : lang ? PRISM_LANGUAGE[lang] : null;

  if (!language || !Prism.languages[language]) {
    return (
      <Frame wrap={wrap}>
        <code>{source}</code>
      </Frame>
    );
  }

  return (
    <Highlight prism={Prism} code={source} language={language} theme={NO_THEME}>
      {({ tokens, getLineProps, getTokenProps }) => (
        <Frame wrap={wrap}>
          <code>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, k) => (
                  <span key={k} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </code>
        </Frame>
      )}
    </Highlight>
  );
}

/** Блок кода с кнопкой «переносить строки»: на телефоне длинные строки иначе уходят за край. */
function Frame({ wrap, children }: { wrap: boolean; children: ReactNode }) {
  return (
    <div className={styles.frame}>
      <pre className={clsx(styles.code, glass.glass, wrap && styles.wrap)}>{children}</pre>
      <button
        type="button"
        className={clsx(styles.wrapButton, wrap && styles.wrapOn)}
        aria-pressed={wrap}
        aria-label="Переносить длинные строки"
        title="Переносить длинные строки"
        onClick={toggleCodeWrap}
      >
        <Icon name="wrap" />
      </button>
    </div>
  );
}
