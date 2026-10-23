import clsx from "clsx";
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { CourseFeature } from "../../../data/types";
import type { CourseProgressSummary } from "../../../features/courses/courses";
import type { CatalogEntry } from "../../../features/sets/catalog";
import { LESSON_FORMS, plural } from "../../../shared/lib/plural";
import { readSessionStorage, writeSessionStorage } from "../../../shared/lib/storage";
import glass from "../../../shared/ui/glass.module.css";
import { Icon } from "../../../shared/ui/Icon";
import { FeatureIcons } from "../CourseBits";
import styles from "./Desktop.module.css";

/** Описание курса из каталога без служебного начала: «Курс 1 из 7, с уроками.» и «С уроками.» видны и так. */
export function cleanDescription(text: string | undefined) {
  return (text ?? "").replace(/^Курс \d+ из \d+, с уроками[^.]*\.\s*/, "").replace(/^С уроками[^.]*\.\s*/, "");
}

/** Название курса в серии без её имени: «Системный дизайн: основы» → «Основы». */
export function shortTitle(title: string) {
  const short = title.replace(/^[^:]+:\s*/, "");
  return short.charAt(0).toUpperCase() + short.slice(1);
}

interface CourseTileProps {
  title: string;
  /** Номер в серии — квадратиком вместо подписи «Курс». */
  number?: number;
  description?: string;
  features: readonly CourseFeature[];
  progress: CourseProgressSummary | null;
  /** «19 уроков · 93 вопроса» — у не начатого курса вместо прогресса. */
  meta: string;
  downloaded?: boolean;
  /** Свой курс по ссылке, не из каталога. */
  mine?: boolean;
  onClick: () => void;
}

/** Карточка курса в сетке десктопа: подпись и значки, название, две строки описания, прогресс или размер. */
export function CourseTile({ title, number, description, features, progress, meta, downloaded, mine, onClick }: CourseTileProps) {
  const started = !!progress?.started;
  return (
    <button type="button" className={clsx(styles.tile, glass.glass)} onClick={onClick}>
      <span className={styles.tileTop}>
        {number ? <span className={styles.number}>{number}</span> : <span className={styles.eyebrow}>{mine ? "Свой курс" : "Курс"}</span>}
        <FeatureIcons features={features} />
      </span>
      <span className={styles.tileTitle}>{title}</span>
      {description && <span className={styles.tileText}>{description}</span>}
      <span className={styles.tileFoot}>
        {started && progress ? <MiniProgress progress={progress} /> : <span className={styles.meta}>{meta}</span>}
        {downloaded && (
          <span className={styles.downloaded}>
            <Icon name="check" />
            скачан
          </span>
        )}
      </span>
    </button>
  );
}

/** Полоса и «5 из 19» или «пройден». */
export function MiniProgress({ progress }: { progress: Pick<CourseProgressSummary, "mastered" | "total" | "finished"> }) {
  return (
    <span className={clsx(styles.mini, progress.finished && styles.miniDone)}>
      <span className={styles.bar}>
        <span style={{ width: `${(progress.total ? progress.mastered / progress.total : 0) * 100}%` }} />
      </span>
      {progress.finished ? (
        <span className={styles.miniText}>
          <Icon name="check" />
          пройден
        </span>
      ) : (
        <span className={styles.miniText}>
          {progress.mastered} из {progress.total}
        </span>
      )}
    </span>
  );
}

/** Карточка «Добавить свой курс» — пунктиром, в конце сетки. */
export function AddCourseTile({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={styles.addTile} onClick={onClick}>
      <span className={styles.addTitle}>
        <Icon name="plus" />
        Добавить свой курс
      </span>
      <span className={styles.meta}>Набор с уроками — по ссылке на YAML или файлом с устройства</span>
    </button>
  );
}

interface RowSectionProps {
  /** Ключ, под которым помнится раскрытие: «Назад» из курса возвращает раздел раскрытым. */
  id: string;
  title: ReactNode;
  /** Число рядом с заголовком; без него — «Показать все» без числа. */
  count?: number;
  /** Ссылка справа в заголовке вместо «Показать все» — например, «Все курсы · 20 ›». */
  link?: { label: string; onClick: () => void };
  items: ReactNode[];
}

/**
 * Раздел из одного ряда карточек — сколько влезает по ширине окна — и «Показать все N»: раздел раскрывается на месте,
 * ссылка становится «Свернуть». Так ни один раздел не выталкивает следующие за край экрана, а прокрутка остаётся
 * одна — у страницы.
 */
export function RowSection({ id, title, count, link, items }: RowSectionProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(items.length);
  const storageKey = `fq.row.${id}`;
  const [open, setOpen] = useState(() => readSessionStorage(storageKey) === "1");

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const measure = () => setColumns(getComputedStyle(grid).gridTemplateColumns.split(" ").length);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(grid);
    return () => observer.disconnect();
  }, []);

  function toggle() {
    writeSessionStorage(storageKey, open ? "0" : "1");
    setOpen(!open);
  }

  const overflow = items.length > columns;
  return (
    <section className={clsx(styles.row, open && overflow && styles.rowOpen)} aria-label={typeof title === "string" ? title : undefined}>
      <div className={styles.rowHead}>
        <h2 className={styles.rowTitle}>
          {title}
          {count !== undefined && <span className={styles.count}> · {count}</span>}
        </h2>
        {link ? (
          <button type="button" className={styles.more} onClick={link.onClick}>
            {link.label}
            <Icon name="chevronRight" />
          </button>
        ) : (
          overflow && (
            <button type="button" className={styles.more} aria-expanded={open} onClick={toggle}>
              {open ? "Свернуть" : `Показать все${count !== undefined ? ` ${count}` : ""}`}
              <Icon name={open ? "chevronDown" : "chevronRight"} className={clsx(open && styles.up)} />
            </button>
          )
        )}
      </div>
      <div ref={gridRef} className={styles.grid}>
        {open ? items : items.slice(0, columns)}
      </div>
    </section>
  );
}

export interface TrackStep {
  entry: CatalogEntry;
  features: readonly CourseFeature[];
  progress: CourseProgressSummary | null;
  /** Не подходит под фильтр «Всех курсов» — шаг приглушён, но порядок серии виден целиком. */
  dimmed?: boolean;
}

/**
 * Серия курсов дорожкой: кружки с номерами по порядку, линия от первого до последнего. Закрашено до курса,
 * на котором человек сейчас, плюс пройденная доля этого курса.
 */
export function SeriesTrack({ name, steps, onOpen }: { name: string; steps: TrackStep[]; onOpen: (entry: CatalogEntry) => void }) {
  const currentIndex = Math.max(
    0,
    steps.findIndex((s) => !s.progress?.finished),
  );
  const current = steps[currentIndex];
  const started = steps.some((s) => s.progress?.started);
  const share = current?.progress ? current.progress.mastered / current.progress.total : 0;
  const filled = started ? (currentIndex + share) / (steps.length - 1 || 1) : 0;
  return (
    <section className={clsx(styles.series, glass.glass)} aria-label={`Серия «${name}»`}>
      <div className={styles.rowHead}>
        <h2 className={styles.rowTitle}>Серия «{name}»</h2>
        <span className={styles.meta}>
          проходить по порядку{started && current ? ` · сейчас курс ${currentIndex + 1}` : ""}
        </span>
      </div>
      <ol className={styles.track} style={{ "--steps": steps.length, "--filled": Math.min(filled, 1) } as CSSProperties}>
        {steps.map((step, i) => {
          const done = !!step.progress?.finished;
          const here = started && i === currentIndex;
          return (
            <li key={step.entry.url} className={clsx(styles.step, done && styles.stepDone, here && styles.stepHere, step.dimmed && styles.dimmed)}>
              <button type="button" className={styles.stepButton} onClick={() => onOpen(step.entry)}>
                <span className={styles.dot}>{done ? <Icon name="check" /> : i + 1}</span>
                <span className={styles.stepTitle}>{shortTitle(step.entry.title)}</span>
                <span className={styles.meta}>
                  {step.entry.lessons.length} {plural(step.entry.lessons.length, LESSON_FORMS)}
                </span>
                {step.progress?.started && !done ? <MiniProgress progress={step.progress} /> : <FeatureIcons features={step.features} />}
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
