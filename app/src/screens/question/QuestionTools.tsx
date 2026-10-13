import clsx from "clsx";
import { Children, Fragment, type ReactNode } from "react";
import { useBookmarks } from "../../features/bookmarks/BookmarksProvider";
import { IconButton } from "../../shared/ui/Button";
import glass from "../../shared/ui/glass.module.css";
import styles from "./QuestionTools.module.css";

/** Инструменты к вопросу — жалоба, закладка, заметка — одной капсулой, через тонкие перегородки. */
export function ToolsCapsule({ children }: { children: ReactNode }) {
  const items = Children.toArray(children);
  return (
    <div className={clsx(styles.tools, glass.glass)}>
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && <span className={styles.divider} />}
          {item}
        </Fragment>
      ))}
    </div>
  );
}

/** Закладка «Вернуться позже»: залита цветом, когда вопрос отмечен. Отмеченные — в статистике. */
export function BookmarkButton({ setId, questionId }: { setId: string; questionId: string }) {
  const { isBookmarked, toggle } = useBookmarks();
  const on = isBookmarked(setId, questionId);
  return (
    <IconButton
      icon="bookmark"
      label={on ? "Убрать из «Вернуться позже»" : "Вернуться позже"}
      aria-pressed={on}
      bare
      className={clsx(on && styles.bookmarkOn)}
      onClick={() => toggle(setId, questionId)}
    />
  );
}
