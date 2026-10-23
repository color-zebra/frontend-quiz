import clsx from "clsx";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import type { Lesson, QuestionBank } from "../../data/types";
import { DesktopPlayer } from "../../features/audio/DesktopPlayer";
import { getLessonGroups, isMastered } from "../../features/lessons/course";
import { useLessons } from "../../features/lessons/LessonsProvider";
import { Icon } from "../../shared/ui/Icon";
import { Screen } from "../../shared/ui/Screen";
import styles from "./LessonDesktop.module.css";

interface LessonDesktopProps {
  bank: QuestionBank;
  lesson: Lesson;
  /** Шапка, кнопка «Слушать», текст и кнопки внизу урока — те же, что на телефоне. */
  children: ReactNode;
  questionCount: number;
  forwardLabel: string;
  onForward: () => void;
  onOpenCourse: () => void;
  onOpenLesson: (lessonId: string) => void;
}

/**
 * Урок на десктопе — три колонки, разнесённые равными промежутками: слева оглавление курса и плеер, в центре текст
 * (около 70 знаков в строке), справа план урока с разделом, который сейчас на экране, вопросы урока и соседние уроки.
 * Боковые колонки прилипают к верху и занимают высоту окна. На узком десктопе (до 1280 px) правой колонки нет:
 * переходы и так есть внизу урока.
 */
export function LessonDesktop({ bank, lesson, children, questionCount, forwardLabel, onForward, onOpenCourse, onOpenLesson }: LessonDesktopProps) {
  const { getCourse } = useLessons();
  const progress = getCourse(bank.setId);
  const lessons = bank.lessons ?? [];
  const index = lessons.indexOf(lesson);
  const previous = lessons[index - 1];
  const next = lessons[index + 1];
  const mastered = lessons.filter((l) => isMastered(progress, l.id)).length;
  const textRef = useRef<HTMLElement>(null);
  const headings = useHeadings(textRef, lesson.id);
  const tocRef = useRef<HTMLDivElement>(null);

  // Текущий урок в оглавлении — на виду, даже если он в конце длинного курса. Прокручиваем только оглавление:
  // scrollIntoView сдвинул бы и саму страницу, и урок открылся бы не с начала.
  useEffect(() => {
    const toc = tocRef.current;
    const item = toc?.querySelector<HTMLElement>("[aria-current]");
    if (toc && item) toc.scrollTop = item.offsetTop - toc.offsetTop - toc.clientHeight / 2 + item.offsetHeight / 2;
  }, [lesson.id]);

  return (
    <Screen width="full" className={styles.screen}>
      <div className={styles.columns}>
        <aside className={styles.left}>
          <button type="button" className={styles.back} onClick={onOpenCourse}>
            <Icon name="arrowLeft" />
            {bank.title}
          </button>
          <div className={styles.courseProgress}>
            <span className={styles.bar}>
              <span style={{ width: `${(mastered / lessons.length) * 100}%` }} />
            </span>
            <span>
              {mastered} из {lessons.length}
            </span>
          </div>
          <nav ref={tocRef} className={styles.toc} aria-label="Оглавление курса">
            {getLessonGroups(lessons).map((group, groupIndex) => (
              <Fragment key={`${groupIndex}-${group.topic ?? ""}`}>
                {group.topic && <h2 className={styles.group}>{group.topic}</h2>}
                {group.lessons.map(({ lesson: item, number }) => {
                  const done = isMastered(progress, item.id);
                  const current = item.id === lesson.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={clsx(styles.tocItem, done && styles.done, current && styles.current)}
                      aria-current={current ? "page" : undefined}
                      onClick={() => !current && onOpenLesson(item.id)}
                    >
                      <span className={styles.mark}>{done ? <Icon name="check" /> : current ? <Icon name="play" /> : number}</span>
                      <span>{item.title}</span>
                    </button>
                  );
                })}
              </Fragment>
            ))}
          </nav>
          <DesktopPlayer onOpenLesson={(setId, lessonId) => setId === bank.setId && lessonId !== lesson.id && onOpenLesson(lessonId)} />
        </aside>

        <article ref={textRef} className={styles.text}>
          {children}
        </article>

        <aside className={styles.right}>
          {headings.list.length > 1 && (
            <nav className={styles.plan} aria-label="В этом уроке">
              <h2 className={styles.planTitle}>В этом уроке</h2>
              {headings.list.map((heading, i) => (
                <button
                  key={`${i}-${heading.text}`}
                  type="button"
                  className={clsx(styles.planItem, i === headings.active && styles.planActive)}
                  onClick={() => heading.element.scrollIntoView({ behavior: "smooth", block: "start" })}
                >
                  {heading.text}
                </button>
              ))}
            </nav>
          )}
          <section className={styles.card} aria-label="Вопросы урока">
            <b>{questionCount ? "Вопросы урока" : next ? "Следующий урок" : "Конец курса"}</b>
            <span className={styles.muted}>
              {questionCount ? `${questionCount} — после чтения, урок засчитается без ошибок` : next ? "У этого урока нет вопросов" : "Это последний урок"}
            </span>
            <button type="button" className={styles.cardButton} onClick={onForward}>
              {forwardLabel}
              <Icon name="arrowRight" />
            </button>
          </section>
          <div className={styles.neighbours}>
            {previous && (
              <button type="button" className={styles.neighbour} onClick={() => onOpenLesson(previous.id)}>
                <span className={styles.arrow}>
                  <Icon name="arrowLeft" />
                </span>
                <span className={styles.neighbourText}>
                  <span className={styles.neighbourLabel}>Урок {index} · назад</span>
                  <b>{previous.title}</b>
                </span>
              </button>
            )}
            {next && (
              <button type="button" className={clsx(styles.neighbour, styles.nextLesson)} onClick={() => onOpenLesson(next.id)}>
                <span className={styles.arrow}>
                  <Icon name="arrowRight" />
                </span>
                <span className={styles.neighbourText}>
                  <span className={styles.neighbourLabel}>Урок {index + 2} · дальше</span>
                  <b>{next.title}</b>
                </span>
              </button>
            )}
          </div>
        </aside>
      </div>
    </Screen>
  );
}

interface Heading {
  text: string;
  element: HTMLElement;
}

/**
 * Разделы урока — заголовки второго уровня в тексте — и тот, что сейчас на экране: последний, чей верх уже поднялся
 * выше трети окна. Внизу страницы — последний раздел, даже если он короткий.
 */
function useHeadings(ref: React.RefObject<HTMLElement | null>, key: string) {
  const [list, setList] = useState<Heading[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const found = [...root.querySelectorAll<HTMLElement>("h2")].map((element) => ({ text: element.textContent ?? "", element }));
    setList(found);
    function update() {
      const line = window.innerHeight / 3;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      let current = 0;
      found.forEach((h, i) => {
        if (h.element.getBoundingClientRect().top < line) current = i;
      });
      setActive(atBottom ? found.length - 1 : current);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [key]);

  return { list, active };
}
