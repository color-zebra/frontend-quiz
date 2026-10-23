import clsx from "clsx";
import type { ReactNode } from "react";
import { DesktopPlayer } from "../features/audio/DesktopPlayer";
import { useMyCourses } from "../features/courses/useMyCourses";
import { Icon, type IconName } from "../shared/ui/Icon";
import type { Section } from "../shared/ui/SectionSwitch";
import styles from "./DesktopShell.module.css";

/**
 * Раскладка десктопа вокруг экрана:
 * - side — боковое меню: разделы, «Мои курсы», плеер, справка;
 * - rail — узкая полоса значков (урок: экрану нужна ширина под три колонки, а разделы остаются под рукой);
 * - focus — без меню (тест): ничего не отвлекает от вопроса.
 */
export type ShellMode = "side" | "rail" | "focus";

const SECTIONS: { id: Section; label: string; icon: IconName }[] = [
  { id: "courses", label: "Курсы", icon: "book" },
  { id: "trainer", label: "Тренажёр", icon: "target" },
  { id: "cabinet", label: "Кабинет", icon: "user" },
];

/** Сколько курсов показать в меню: остальные — на экране «Курсы». */
const MENU_COURSES = 5;

interface DesktopShellProps {
  mode: ShellMode;
  /** Раздел, к которому относится открытый экран; null — справка и прочее вне разделов. */
  section: Section | null;
  /** Открыт этот курс — он подсвечен в «Моих курсах». */
  courseId?: string;
  onSelectSection: (section: Section) => void;
  onOpenCourse: (setId: string) => void;
  onOpenHelp: () => void;
  onOpenLesson: (setId: string, lessonId: string) => void;
  children: ReactNode;
}

export function DesktopShell({ mode, section, courseId, onSelectSection, onOpenCourse, onOpenHelp, onOpenLesson, children }: DesktopShellProps) {
  const { mine } = useMyCourses();
  if (mode === "focus") return <div className={styles.focus}>{children}</div>;

  if (mode === "rail") {
    return (
      <div className={clsx(styles.shell, styles.withRail)}>
        <nav className={styles.rail} aria-label="Разделы">
          <span className={styles.logo} aria-hidden="true">
            {"{ }"}
          </span>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={clsx(styles.railItem, s.id === section && styles.current)}
              aria-current={s.id === section ? "page" : undefined}
              onClick={() => onSelectSection(s.id)}
            >
              <Icon name={s.icon} />
              {s.label}
            </button>
          ))}
          <span className={styles.grow} />
          <button type="button" className={styles.railItem} onClick={onOpenHelp}>
            <Icon name="help" />
            Справка
          </button>
        </nav>
        <div className={styles.main}>{children}</div>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.side}>
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden="true">
            {"{ }"}
          </span>
          Zubrilka
        </div>
        <nav className={styles.nav} aria-label="Разделы">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={clsx(styles.navItem, s.id === section && styles.current)}
              aria-current={s.id === section ? "page" : undefined}
              onClick={() => onSelectSection(s.id)}
            >
              <Icon name={s.icon} />
              {s.label}
            </button>
          ))}
        </nav>
        {mine.length > 0 && (
          <section className={styles.mine} aria-label="Мои курсы">
            <h2 className={styles.label}>Мои курсы</h2>
            {mine.slice(0, MENU_COURSES).map(({ record, bank, state }) => (
              <button
                key={record.id}
                type="button"
                className={clsx(styles.course, record.id === courseId && styles.courseOn)}
                onClick={() => onOpenCourse(record.id)}
              >
                <span className={styles.courseTitle}>{bank.title}</span>
                <span className={styles.courseLine}>
                  <span className={styles.bar}>
                    <span
                      className={clsx(styles.fill, state.finished && styles.fillOk)}
                      style={{ width: `${(state.mastered / state.total) * 100}%` }}
                    />
                  </span>
                  <span className={clsx(styles.courseNote, state.finished && styles.ok)}>
                    {state.finished ? (
                      <>
                        <Icon name="check" />
                        пройден
                      </>
                    ) : (
                      `${state.mastered} из ${state.total}`
                    )}
                  </span>
                </span>
              </button>
            ))}
          </section>
        )}
        <span className={styles.grow} />
        <DesktopPlayer onOpenLesson={onOpenLesson} />
        <button type="button" className={styles.navItem} onClick={onOpenHelp}>
          <Icon name="help" />
          Справка
        </button>
      </aside>
      <div className={styles.main}>{children}</div>
    </div>
  );
}
