import clsx from "clsx";
import { useState } from "react";
import type { CourseFeature } from "../../data/types";
import {
  CATALOG_COURSES,
  FEATURE_INFO,
  getCourseState,
  getEntryProgress,
  getEntrySetId,
  getFeatures,
} from "../../features/courses/courses";
import { useLessons } from "../../features/lessons/LessonsProvider";
import { findAddedSet, type CatalogEntry } from "../../features/sets/catalog";
import { useSets } from "../../features/sets/SetsProvider";
import { plural } from "../../shared/lib/plural";
import { IconButton } from "../../shared/ui/Button";
import { SectionLabel } from "../../shared/ui/Card";
import { Chip, ChipGroup } from "../../shared/ui/Chip";
import glass from "../../shared/ui/glass.module.css";
import { Icon } from "../../shared/ui/Icon";
import { Screen, TopBar } from "../../shared/ui/Screen";
import { ScreenTitle } from "../../shared/ui/ScreenTitle";
import { CourseMarks, formatCourseSize } from "./CourseBits";
import styles from "./Courses.module.css";
import { AllCoursesDesktop } from "./desktop/AllCoursesDesktop";
import { useIsDesktop } from "../../shared/ui/useIsDesktop";

type Filter = "all" | CourseFeature | "new";

const COURSE_FORMS = ["курс", "курса", "курсов"] as const;
const TASK_FORMS = ["задача", "задачи", "задач"] as const;

/** «12 задач» — у устной тренировки вопросы — это задачи для ответа вслух. */
export function formatTasks(n: number) {
  return `${n} ${plural(n, TASK_FORMS)}`;
}

interface AllCoursesScreenProps {
  onBack: () => void;
  /** Курс: добавлен — его страница, нет — страница до скачивания. */
  onOpenCourse: (entry: CatalogEntry) => void;
  onOpenSets: () => void;
  /** Свой курс по ссылке (не из каталога) — на десктопе он в разделе «Свои курсы». */
  onOpenOwnCourse: (setId: string) => void;
}

/** Название курса в серии без её имени: «Системный дизайн: основы» → «Основы». */
function shortTitle(title: string) {
  const short = title.replace(/^[^:]+:\s*/, "");
  return short.charAt(0).toUpperCase() + short.slice(1);
}

/**
 * Все курсы каталога: фильтры (здесь же расшифровка значков), серия по системному дизайну нумерованным списком —
 * её порядок важен, — отдельные курсы карточками и вход к своим наборам. Дополнения к курсу (устная тренировка)
 * здесь не показываются: они на странице своего курса и в «Своих наборах» тренажёра.
 */
export function AllCoursesScreen(props: AllCoursesScreenProps) {
  return useIsDesktop() ? <AllCoursesDesktop {...props} /> : <AllCoursesMobile {...props} />;
}

function AllCoursesMobile({ onBack, onOpenCourse, onOpenSets }: AllCoursesScreenProps) {
  const { sets, getSetBank } = useSets();
  const { getCourse } = useLessons();
  const [filter, setFilter] = useState<Filter>("all");

  // Скачан ли курс и где человек в нём — два разных вопроса: прогресс есть и у удалённого с телефона курса.
  function describe(entry: CatalogEntry) {
    const record = findAddedSet(entry, sets);
    const bank = record && getSetBank(record.id);
    const setId = record?.id ?? getEntrySetId(entry);
    const progress = setId ? getCourse(setId) : undefined;
    const state = bank ? getCourseState(bank, progress) : getEntryProgress(entry, progress);
    return { downloaded: !!record, state, features: getFeatures(bank, entry) };
  }

  const visible = CATALOG_COURSES.filter((entry) => {
    const { features, state } = describe(entry);
    if (filter === "all") return true;
    if (filter === "new") return !state?.started;
    return features.includes(filter);
  });
  const seriesNames = [...new Set(visible.map((e) => e.series).filter((s): s is string => !!s))];
  const single = visible.filter((e) => !e.series);

  function marks(entry: CatalogEntry) {
    const { features, state, downloaded } = describe(entry);
    return <CourseMarks features={features} progress={state} downloaded={downloaded} />;
  }

  return (
    <Screen>
      <TopBar>
        <IconButton icon="arrowLeft" label="Назад" onClick={onBack} />
      </TopBar>
      <ScreenTitle
        title="Все курсы"
        subtitle={`${CATALOG_COURSES.length} ${plural(CATALOG_COURSES.length, COURSE_FORMS)}. Курс скачивается, когда начинаешь его, и дальше работает без интернета.`}
      />

      <div className={styles.filters}>
        <ChipGroup>
          <Chip label="Все" on={filter === "all"} onClick={() => setFilter("all")} />
          {(Object.keys(FEATURE_INFO) as CourseFeature[]).map((f) => (
            <Chip key={f} label={FEATURE_INFO[f].filter} icon={FEATURE_INFO[f].icon} on={filter === f} onClick={() => setFilter(f)} />
          ))}
          <Chip label="Не начатые" on={filter === "new"} onClick={() => setFilter("new")} />
        </ChipGroup>
      </div>

      {visible.length === 0 && <p className={styles.cardMeta}>Таких курсов пока нет.</p>}

      {seriesNames.map((name) => (
        <section key={name} aria-label={`Серия «${name}»`}>
          <SectionLabel>Серия · {name}</SectionLabel>
          <ol className={clsx(styles.list, styles.series, glass.glass)}>
            {visible
              .filter((e) => e.series === name)
              .map((entry) => {
                const number = CATALOG_COURSES.filter((e) => e.series === name).indexOf(entry) + 1;
                return (
                  <li key={entry.url} className={styles.seriesItem}>
                    <button type="button" className={styles.seriesRow} onClick={() => onOpenCourse(entry)}>
                      <span className={styles.seriesNumber}>{number}</span>
                      <span className={styles.seriesText}>
                        <span className={styles.cardTitle}>{shortTitle(entry.title)}</span>
                        <span className={styles.cardMeta}>{formatCourseSize(entry.lessons.length, entry.count)}</span>
                        {marks(entry)}
                      </span>
                      <Icon name="chevronRight" className={styles.chevron} />
                    </button>
                  </li>
                );
              })}
          </ol>
        </section>
      ))}

      {single.length > 0 && (
        <section aria-label="Отдельные курсы">
          <SectionLabel>Отдельные курсы</SectionLabel>
          <ul className={styles.list}>
            {single.map((entry) => {
              return (
                <li key={entry.url}>
                  <button type="button" className={clsx(styles.card, glass.glass)} onClick={() => onOpenCourse(entry)}>
                    <span className={styles.cardHead}>
                      <span className={styles.cardTitle}>{entry.title}</span>
                      <Icon name="chevronRight" className={styles.chevron} />
                    </span>
                    <span className={styles.cardText}>{entry.description.replace(/^С уроками[^.]*\.\s*/, "")}</span>
                    <span className={styles.cardMeta}>{formatCourseSize(entry.lessons.length, entry.count)}</span>
                    {marks(entry)}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <button type="button" className={clsx(styles.linkRow, styles.dashed, glass.glass)} onClick={onOpenSets}>
        <Icon name="plus" />
        <span className={styles.linkText}>
          <span className={styles.linkTitle}>Добавить свой курс</span>
          <span className={styles.linkSub}>Набор с уроками — по ссылке на YAML или файлом с устройства</span>
        </span>
        <Icon name="chevronRight" className={styles.chevron} />
      </button>
    </Screen>
  );
}
