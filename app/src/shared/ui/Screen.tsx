import type { ReactNode } from "react";
import styles from "./Screen.module.css";

/** Колонка экрана: на телефоне во всю ширину, на ноутбуке — по центру. */
export function Screen({ children }: { children: ReactNode }) {
  return <main className={styles.screen}>{children}</main>;
}

/** Строка вверху экрана: слева кнопка или логотип, по центру подпись, справа действие. */
export function TopBar({ children }: { children: ReactNode }) {
  return <header className={styles.topBar}>{children}</header>;
}

/** Панель кнопок, прилипающая к низу экрана. Плотнее обычного стекла, чтобы текст под ней не просвечивал. */
export function ActionBar({ children }: { children: ReactNode }) {
  return <div className={styles.actionBar}>{children}</div>;
}
