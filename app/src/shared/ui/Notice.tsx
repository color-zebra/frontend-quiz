import clsx from "clsx";
import glass from "./glass.module.css";
import { Icon } from "./Icon";
import styles from "./Notice.module.css";

interface NoticeProps {
  kind: "ok" | "error";
  text: string;
  /** Раскрывающиеся подробности под текстом, например список пропущенных вопросов с причинами. */
  details?: { title: string; items: string[] };
  onClose: () => void;
}

/** Сообщение о результате действия: обновления базы, добавления набора и т. п. */
export function Notice({ kind, text, details, onClose }: NoticeProps) {
  return (
    <div className={clsx(styles.notice, glass.glass, kind === "error" && styles.error)} role="status">
      <div className={styles.content}>
        <span>{text}</span>
        {details && details.items.length > 0 && (
          <details className={styles.details}>
            <summary>{details.title}</summary>
            <ul>
              {details.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </details>
        )}
      </div>
      <button type="button" className={styles.close} aria-label="Скрыть" onClick={onClose}>
        <Icon name="close" />
      </button>
    </div>
  );
}
