import { useState } from "react";
import type { CourseFeature } from "../../../data/types";
import {
  CATALOG_COURSES,
  FEATURE_INFO,
  findCatalogEntry,
  getCourseState,
  getEntryProgress,
  getEntrySetId,
  getFeatures,
} from "../../../features/courses/courses";
import { useMyCourses } from "../../../features/courses/useMyCourses";
import { useLessons } from "../../../features/lessons/LessonsProvider";
import { findAddedSet, type CatalogEntry } from "../../../features/sets/catalog";
import { useSets } from "../../../features/sets/SetsProvider";
import { plural } from "../../../shared/lib/plural";
import { IconButton } from "../../../shared/ui/Button";
import { Chip, ChipGroup } from "../../../shared/ui/Chip";
import { Screen, TopBar } from "../../../shared/ui/Screen";
import { ScreenTitle } from "../../../shared/ui/ScreenTitle";
import { formatCourseSize } from "../CourseBits";
import { AddCourseTile, cleanDescription, CourseTile, RowSection, SeriesTrack } from "./CourseParts";
import styles from "./Desktop.module.css";

type Filter = "all" | CourseFeature | "new";
const COURSE_FORMS = ["курс", "курса", "курсов"] as const;

interface AllCoursesDesktopProps {
  onBack: () => void;
  onOpenCourse: (entry: CatalogEntry) => void;
  /** Свой курс по ссылке — его страница. */
  onOpenOwnCourse: (setId: string) => void;
  onOpenSets: () => void;
}

/**
 * «Все курсы» на десктопе: фильтры, серия дорожкой (неподходящие под фильтр шаги приглушены — порядок серии виден
 * целиком), отдельные курсы и свои — по ряду с «Показать все».
 */
export function AllCoursesDesktop({ onBack, onOpenCourse, onOpenOwnCourse, onOpenSets }: AllCoursesDesktopProps) {
  const { sets, getSetBank } = useSets();
  const { getCourse } = useLessons();
  const { mine } = useMyCourses();
  const [filter, setFilter] = useState<Filter>("all");

  function describe(entry: CatalogEntry) {
    const record = findAddedSet(entry, sets);
    const bank = record && getSetBank(record.id);
    const setId = record?.id ?? getEntrySetId(entry);
    const progress = setId ? getCourse(setId) : undefined;
    const state = bank ? getCourseState(bank, progress) : getEntryProgress(entry, progress);
    return { downloaded: !!record, state, features: getFeatures(bank, entry) };
  }

  function matches(entry: CatalogEntry) {
    const { features, state } = describe(entry);
    if (filter === "all") return true;
    if (filter === "new") return !state?.started;
    return features.includes(filter);
  }

  const seriesName = CATALOG_COURSES.find((e) => e.series)?.series;
  const series = CATALOG_COURSES.filter((e) => e.series === seriesName);
  const single = CATALOG_COURSES.filter((e) => !e.series && matches(e));
  const own = mine.filter((c) => !findCatalogEntry(c.record));
  const seriesVisible = series.some(matches);

  return (
    <Screen width="wide" className={styles.page}>
      <TopBar>
        <IconButton icon="arrowLeft" label="Назад" onClick={onBack} />
      </TopBar>
      <div className={styles.head}>
        <ScreenTitle
          title="Все курсы"
          subtitle={`${CATALOG_COURSES.length} ${plural(CATALOG_COURSES.length, COURSE_FORMS)}. Курс скачивается, когда начинаешь его, и дальше работает без интернета.`}
        />
        <ChipGroup>
          <Chip label="Все" on={filter === "all"} onClick={() => setFilter("all")} />
          {(Object.keys(FEATURE_INFO) as CourseFeature[]).map((f) => (
            <Chip key={f} label={FEATURE_INFO[f].filter} icon={FEATURE_INFO[f].icon} on={filter === f} onClick={() => setFilter(f)} />
          ))}
          <Chip label="Не начатые" on={filter === "new"} onClick={() => setFilter("new")} />
        </ChipGroup>
      </div>

      {seriesName && seriesVisible && (
        <SeriesTrack
          name={seriesName}
          steps={series.map((entry) => {
            const { features, state } = describe(entry);
            return { entry, features, progress: state, dimmed: !matches(entry) };
          })}
          onOpen={onOpenCourse}
        />
      )}

      {single.length > 0 && (
        <RowSection
          id="all-single"
          title="Отдельные курсы"
          count={single.length}
          items={single.map((entry) => {
            const { features, state, downloaded } = describe(entry);
            return (
              <CourseTile
                key={entry.url}
                title={entry.title}
                description={cleanDescription(entry.description)}
                features={features}
                progress={state}
                meta={formatCourseSize(entry.lessons.length, entry.count)}
                downloaded={downloaded}
                onClick={() => onOpenCourse(entry)}
              />
            );
          })}
        />
      )}

      {!seriesVisible && single.length === 0 && <p className={styles.meta}>Таких курсов пока нет.</p>}

      <RowSection
        id="all-own"
        title="Свои курсы"
        count={own.length || undefined}
        items={[
          ...own.map(({ record, bank, state }) => (
            <CourseTile
              key={record.id}
              title={bank.title ?? "Курс"}
              features={getFeatures(bank, undefined)}
              progress={state}
              meta={formatCourseSize(state.total, bank.questions.length)}
              downloaded
              mine
              onClick={() => onOpenOwnCourse(record.id)}
            />
          )),
          <AddCourseTile key="add" onClick={onOpenSets} />,
        ]}
      />
    </Screen>
  );
}
