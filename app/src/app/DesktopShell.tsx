import clsx from "clsx";
import { useState, type ReactNode } from "react";
import { readStorage, writeStorage } from "../shared/lib/storage";
import { DesktopPlayer } from "../features/audio/DesktopPlayer";
import { useMyCourses } from "../features/courses/useMyCourses";
import { useProgress } from "../features/progress/ProgressProvider";
import { getBankStats } from "../features/progress/stats";
import { BUILTIN_SET_ID, type QuestionBank } from "../data/types";
import { IconButton } from "../shared/ui/Button";
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
  /** Основная база — для прогресса по темам в меню тренажёра. */
  bank: QuestionBank;
  onOpenStats: () => void;
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

export function DesktopShell({
  mode,
  bank,
  section,
  courseId,
  onSelectSection,
  onOpenCourse,
  onOpenHelp,
  onOpenLesson,
  onOpenStats,
  children,
}: DesktopShellProps) {
  const { mine } = useMyCourses();
  if (mode === "focus") return <div className={styles.focus}>{children}</div>;

  if (mode === "rail") {
    return (
      <div className={clsx(styles.shell, styles.withRail)}>
        <nav className={styles.rail} aria-label="Разделы">
          <button type="button" className={styles.logoButton} aria-label="Zubrilka — на главную" onClick={() => onSelectSection("courses")}>
            <span className={styles.logo} aria-hidden="true">
              {"{ }"}
            </span>
          </button>
          <IconButton icon="help" label="Справка" bare className={styles.railHelp} onClick={onOpenHelp} />
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
        </nav>
        <div className={styles.main}>{children}</div>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.side}>
        {/* Логотип ведёт на главную — «Курсы», как на любом сайте. */}
        {/* Справка — значком справа от логотипа: внизу меню её место занял плеер. */}
        <div className={styles.brandRow}>
          <button type="button" className={styles.brand} title="На главную" onClick={() => onSelectSection("courses")}>
            <span className={styles.logo} aria-hidden="true">
              {"{ }"}
            </span>
            Zubrilka
          </button>
          <IconButton icon="help" label="Справка" onClick={onOpenHelp} />
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
        {/* Под разделами — то, что относится к открытому: в «Курсах» — мои курсы, в «Тренажёре» — прогресс по темам. */}
        {section === "trainer" && <TopicProgress bank={bank} onOpenStats={onOpenStats} />}
        {section === "courses" && mine.length > 0 && (
          <MenuGroup id="mine" title="Мои курсы">
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
          </MenuGroup>
        )}
        <span className={styles.grow} />
        <DesktopPlayer onOpenLesson={onOpenLesson} />
      </aside>
      <div className={styles.main}>{children}</div>
    </div>
  );
}

/**
 * Прогресс по темам основной базы — в меню тренажёра: освоено (зелёным) и ошибки (красным) на каждую тему,
 * в порядке базы. Только для обзора: темы выбирают на странице тренажёра. Подробно — «Статистика».
 */
function TopicProgress({ bank, onOpenStats }: { bank: QuestionBank; onOpenStats: () => void }) {
  const { records, getProgress } = useProgress();
  const stats = getBankStats(bank, records, (id) => getProgress(BUILTIN_SET_ID, id));
  const topics = bank.topics.flatMap((t) => stats.topics.find((s) => s.id === t.id) ?? []);
  return (
    <MenuGroup id="topics" title="Прогресс по темам">
      {topics.map((topic) => (
        <div key={topic.id} className={styles.topic}>
          <span className={styles.courseLine}>
            <span className={styles.courseTitle}>{topic.title}</span>
            <span className={styles.courseNote}>
              {topic.mastered} из {topic.total}
            </span>
          </span>
          <span className={styles.bar}>
            <span className={styles.fillOkPart} style={{ width: `${(topic.mastered / topic.total) * 100}%` }} />
            <span className={styles.fillBadPart} style={{ width: `${(topic.mistakes / topic.total) * 100}%` }} />
          </span>
        </div>
      ))}
      <button type="button" className={styles.statsLink} onClick={onOpenStats}>
        Статистика
        <Icon name="chevronRight" />
      </button>
    </MenuGroup>
  );
}

/**
 * Раздел меню под пунктами — «Мои курсы» или «Прогресс по темам»: заголовок со стрелкой сворачивает его, чтобы
 * на низком окне он не теснил плеер. Свёрнут ли раздел, запоминается на устройстве.
 */
function MenuGroup({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  const key = `fq.menu.${id}`;
  const [open, setOpen] = useState(() => readStorage(key) !== "0");
  return (
    <section className={styles.mine} aria-label={title}>
      <h2 className={styles.label}>
        <button
          type="button"
          className={styles.groupToggle}
          aria-expanded={open}
          onClick={() => {
            writeStorage(key, open ? "0" : "1");
            setOpen(!open);
          }}
        >
          {title}
          <Icon name="chevronDown" className={clsx(styles.groupArrow, !open && styles.groupClosed)} />
        </button>
      </h2>
      {open && children}
    </section>
  );
}
