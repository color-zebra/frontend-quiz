import clsx from "clsx";
import type { ReactNode } from "react";
import { setDockSlot } from "./dockSlot";
import styles from "./Screen.module.css";

/** Колонка экрана: на телефоне во всю ширину, на ноутбуке — по центру. */
export function Screen({ children }: { children: ReactNode }) {
  return <main className={styles.screen}>{children}</main>;
}

/** Строка вверху экрана: слева кнопка или логотип, по центру подпись, справа действие. */
export function TopBar({ children }: { children: ReactNode }) {
  return <header className={styles.topBar}>{children}</header>;
}

interface ActionBarProps {
  /** Колонки поровну. Без этого последняя кнопка вдвое шире остальных. */
  even?: boolean;
  /** Кнопка над панелью справа — например, «Почему?» после ответа. */
  aside?: ReactNode;
  children: ReactNode;
}

/** Панель кнопок, прилипающая к низу экрана. Плотнее обычного стекла, чтобы текст под ней не просвечивал. */
export function ActionBar({ even = false, aside, children }: ActionBarProps) {
  return (
    <div className={styles.dock}>
      {/* Сверху — место для плавающих кнопок приложения (свёрнутый плеер), под ним — своя кнопка панели. */}
      <div className={styles.aside}>
        <div ref={setDockSlot} className={styles.slot} />
        {aside}
      </div>
      <div className={clsx(styles.actionBar, even && styles.even)}>{children}</div>
    </div>
  );
}
