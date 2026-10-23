import clsx from "clsx";
import type { ReactNode } from "react";
import { setDockSlot } from "./dockSlot";
import styles from "./Screen.module.css";

/**
 * Ширина экрана на десктопе: normal — колонка до 960 px (настройки, справка, списки), wide — до 1600 px (курсы,
 * каталог, страница курса), full — без предела: экран раскладывает колонки сам (урок, тест).
 */
export type ScreenWidth = "normal" | "wide" | "full";

/** Колонка экрана: на телефоне во всю ширину, на десктопе — по центру, шириной по width. */
export function Screen({ width = "normal", className, children }: { width?: ScreenWidth; className?: string; children: ReactNode }) {
  return <main className={clsx(styles.screen, styles[width], className)}>{children}</main>;
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
  className?: string;
  /** Класс обёртки панели — например, чтобы на десктопе она стояла под содержимым, а не у низа окна. */
  dockClassName?: string;
  children: ReactNode;
}

/** Панель кнопок, прилипающая к низу экрана. Плотнее обычного стекла, чтобы текст под ней не просвечивал. */
export function ActionBar({ even = false, aside, className, dockClassName, children }: ActionBarProps) {
  return (
    <div className={clsx(styles.dock, dockClassName)}>
      {/* Сверху — место для плавающих кнопок приложения (свёрнутый плеер), под ним — своя кнопка панели. */}
      <div className={styles.aside}>
        <div ref={setDockSlot} className={styles.slot} />
        {aside}
      </div>
      <div className={clsx(styles.actionBar, even && styles.even, className)}>{children}</div>
    </div>
  );
}
