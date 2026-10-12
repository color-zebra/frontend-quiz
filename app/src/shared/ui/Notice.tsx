import clsx from "clsx";
import glass from "./glass.module.css";
import { Icon } from "./Icon";
import styles from "./Notice.module.css";

interface NoticeProps {
  kind: "ok" | "error";
  text: string;
  onClose: () => void;
}

/** Сообщение о результате действия: обновления базы, добавления набора и т. п. */
export function Notice({ kind, text, onClose }: NoticeProps) {
  return (
    <div className={clsx(styles.notice, glass.glass, kind === "error" && styles.error)} role="status">
      <span>{text}</span>
      <button type="button" className={styles.close} aria-label="Скрыть" onClick={onClose}>
        <Icon name="close" />
      </button>
    </div>
  );
}
