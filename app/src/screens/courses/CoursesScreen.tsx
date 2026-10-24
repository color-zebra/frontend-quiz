import clsx from "clsx";
import { useState } from "react";
import { useAudio } from "../../features/audio/AudioProvider";
import {
  CATALOG_COURSES,
  findCatalogEntry,
  getEntryProgress,
  getEntrySetId,
  getFeatures,
  getQuestionMastery,
} from "../../features/courses/courses";
import { useMyCourses, type MyCourse } from "../../features/courses/useMyCourses";
import { useLessons } from "../../features/lessons/LessonsProvider";
import { useProgress } from "../../features/progress/ProgressProvider";
import { UpdateBanner } from "../../features/pwa/AppUpdate";
import { findAddedSet, type CatalogEntry } from "../../features/sets/catalog";
import { useSets } from "../../features/sets/SetsProvider";
import { plural } from "../../shared/lib/plural";
import { readStorage, writeStorage } from "../../shared/lib/storage";
import { Button, IconButton } from "../../shared/ui/Button";
import { SectionLabel } from "../../shared/ui/Card";
import glass from "../../shared/ui/glass.module.css";
import { Icon } from "../../shared/ui/Icon";
import { Screen } from "../../shared/ui/Screen";
import { SectionHeader, type Section } from "../../shared/ui/SectionSwitch";
import { CourseMarks, DoneMark, FeatureIcons, formatCourseSize, ProgressLine } from "./CourseBits";
import styles from "./Courses.module.css";
import { CoursesDesktop } from "./desktop/CoursesDesktop";
import { useIsDesktop } from "../../shared/ui/useIsDesktop";
import type { QuestionBank } from "../../data/types";

/** Подсказку новичку показываем, пока её не закрыли и не открыли инструкцию. */
const HELP_HINT_KEY = "fq.helpHintSeen";
/** Сколько курсов каталога показать при первом запуске — остальные в «Все курсы». */
const FIRST_RUN_COURSES = 4;

interface CoursesScreenProps {
  /** Основная база — для карточки «Сегодня» на десктопе (ошибки тренажёра). */
  bank: QuestionBank;
  onRetryMistakes: (questionIds: string[]) => void;
  onSelectSection: (section: Section) => void;
  onOpenHelp: () => void;
  onOpenCourse: (setId: string) => void;
  onOpenPreview: (url: string) => void;
  onOpenAll: () => void;
  onOpenLesson: (setId: string, lessonId: string) => void;
  onOpenLessonQuiz: (setId: string, lessonId: string) => void;
}

/**
 * «Курсы» — первый экран приложения. Новичку — подсказка и курсы каталога; дальше — «Продолжить» (урок, на котором
 * остановился, читать или слушать), «Мои курсы» с прогрессом и вход во «Все курсы».
 */
export function CoursesScreen(props: CoursesScreenProps) {
  const desktop = useIsDesktop();
  const [showHint, setShowHint] = useState(() => readStorage(HELP_HINT_KEY) === null);
  function hideHint() {
    setShowHint(false);
    writeStorage(HELP_HINT_KEY, "1");
  }
  if (desktop) return <CoursesDesktop {...props} showHint={showHint} onHideHint={hideHint} />;
  return <CoursesMobile {...props} showHint={showHint} onHideHint={hideHint} />;
}

function CoursesMobile({
  showHint,
  onHideHint: hideHint,
  onSelectSection,
  onOpenHelp,
  onOpenCourse,
  onOpenPreview,
  onOpenAll,
  onOpenLesson,
  onOpenLessonQuiz,
}: CoursesScreenProps & { showHint: boolean; onHideHint: () => void }) {
  const { sets } = useSets();
  const { getCourse } = useLessons();
  const { mine, current } = useMyCourses();
  const { getProgress } = useProgress();
  const audio = useAudio();

  const others = mine.filter((c) => c !== current);
  const notAdded = CATALOG_COURSES.filter((entry) => !findAddedSet(entry, sets));

  // Курс могли удалить с телефона, а прогресс остался — он виден и здесь.
  function entryProgress(entry: CatalogEntry) {
    const setId = getEntrySetId(entry);
    return getEntryProgress(entry, setId ? getCourse(setId) : undefined);
  }

  return (
    <Screen>
      <SectionHeader
        section="courses"
        title="Курсы"
        subtitle={mine.length === 0 ? "Уроки, озвучка и вопросы для самопроверки" : undefined}
        onSelect={onSelectSection}
        onOpenHelp={() => {
          hideHint();
          onOpenHelp();
        }}
      >
        <UpdateBanner />
      </SectionHeader>

      {showHint && (
        <div className={clsx(styles.hint, glass.glass)}>
          <div className={styles.hintBody}>
            <p>
              <b>Впервые здесь?</b> Выбери курс: сначала урок, потом вопросы по нему. Курс скачается, когда начнёшь,
              и дальше работает без интернета.
            </p>
            <button
              type="button"
              className={styles.textLink}
              onClick={() => {
                hideHint();
                onOpenHelp();
              }}
            >
              Как устроена Зубрилка
            </button>
          </div>
          <IconButton icon="close" label="Скрыть подсказку" bare onClick={hideHint} />
        </div>
      )}

      {current && (
        <ContinueCard
          course={current}
          onOpenCourse={() => onOpenCourse(current.record.id)}
          playing={audio.playing && audio.track?.setId === current.record.id && audio.track.lessonId === current.state.lesson.id}
          onRead={() =>
            current.state.inQuiz
              ? onOpenLessonQuiz(current.record.id, current.state.lesson.id)
              : onOpenLesson(current.record.id, current.state.lesson.id)
          }
          onListen={() => {
            const { lesson } = current.state;
            if (!lesson.audio) return;
            if (audio.playing && audio.track?.lessonId === lesson.id && audio.track.setId === current.record.id) audio.pause();
            else audio.play({ setId: current.record.id, lessonId: lesson.id, src: lesson.audio, title: lesson.title, course: current.bank.title ?? "" });
          }}
        />
      )}

      {others.length > 0 && (
        <>
          <SectionLabel className={styles.sectionHead}>Мои курсы</SectionLabel>
          <ul className={styles.list}>
            {others.map((course) => (
              <li key={course.record.id}>
                <MyCourseCard course={course} getProgress={(id) => getProgress(course.record.id, id)} onOpen={() => onOpenCourse(course.record.id)} />
              </li>
            ))}
          </ul>
        </>
      )}

      {mine.length === 0 ? (
        <>
          <div className={styles.sectionHead}>
            <SectionLabel>Все курсы · {CATALOG_COURSES.length}</SectionLabel>
            <button type="button" className={styles.textLink} onClick={onOpenAll}>
              Смотреть все
            </button>
          </div>
          <ul className={styles.list}>
            {CATALOG_COURSES.slice(0, FIRST_RUN_COURSES).map((entry) => (
              <li key={entry.url}>
                <button type="button" className={clsx(styles.card, glass.glass)} onClick={() => onOpenPreview(entry.url)}>
                  <span className={styles.cardHead}>
                    <span className={styles.cardTitle}>{entry.title}</span>
                    <FeatureIcons features={entry.features} />
                  </span>
                  <span className={styles.cardMeta}>{formatCourseSize(entry.lessons.length, entry.count)}</span>
                  <CourseMarks features={[]} progress={entryProgress(entry)} downloaded={false} />
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <button type="button" className={clsx(styles.linkRow, glass.glass)} onClick={onOpenAll}>
          <Icon name="book" />
          <span className={styles.linkText}>
            <span className={styles.linkTitle}>{notAdded.length ? `Все курсы · ещё ${notAdded.length}` : "Все курсы"}</span>
          </span>
          <Icon name="chevronRight" className={styles.chevron} />
        </button>
      )}
    </Screen>
  );
}

interface ContinueCardProps {
  course: MyCourse;
  playing: boolean;
  onRead: () => void;
  onListen: () => void;
  onOpenCourse: () => void;
}

/**
 * Урок, на котором остановился: читать (или продолжить вопросы) и слушать. Нажатие на карточку мимо кнопок —
 * страница курса с оглавлением: сам курс в «Моих курсах» ниже не повторяется, другого входа к нему нет.
 */
function ContinueCard({ course, playing, onRead, onListen, onOpenCourse }: ContinueCardProps) {
  const { state, bank } = course;
  return (
    <section className={clsx(styles.continue, styles.linked, glass.glass)} aria-label="Продолжить">
      <SectionLabel className={styles.label}>Продолжить</SectionLabel>
      <button type="button" className={styles.courseLink} onClick={onOpenCourse}>
        {bank.title}
        <Icon name="chevronRight" />
      </button>
      <h2 className={styles.continueLesson}>
        Урок {state.number} · {state.lesson.title}
      </h2>
      <ProgressLine value={state.mastered} total={state.total} label={`${state.mastered} из ${state.total}`} />
      <div className={styles.actions}>
        <Button iconAfter="arrowRight" onClick={onRead}>
          {state.inQuiz ? "К вопросам" : "Читать урок"}
        </Button>
        {state.lesson.audio && (
          <Button variant="secondary" icon={playing ? "pause" : "headphones"} onClick={onListen}>
            {playing ? "Пауза" : "Слушать"}
          </Button>
        )}
      </div>
    </section>
  );
}

interface MyCourseCardProps {
  course: MyCourse;
  getProgress: Parameters<typeof getQuestionMastery>[1];
  onOpen: () => void;
}

function MyCourseCard({ course, getProgress, onOpen }: MyCourseCardProps) {
  const { record, bank, state } = course;
  const entry = findCatalogEntry(record);
  const questions = state.finished ? getQuestionMastery(bank, getProgress) : null;
  return (
    <button type="button" className={clsx(styles.card, glass.glass)} onClick={onOpen}>
      <span className={styles.cardHead}>
        <span className={styles.cardTitle}>{bank.title}</span>
        {state.finished ? <DoneMark /> : entry ? <FeatureIcons features={getFeatures(bank, entry)} /> : <span className={styles.mine}>свой</span>}
      </span>
      {questions ? (
        <span className={styles.cardMeta}>
          Освоено {questions.mastered} из {questions.total} вопросов
          {questions.mistakes.length > 0 &&
            ` · ${questions.mistakes.length} ${plural(questions.mistakes.length, ["ошибка ждёт", "ошибки ждут", "ошибок ждут"])} повтора`}
        </span>
      ) : state.started ? (
        <ProgressLine value={state.mastered} total={state.total} label={`урок ${state.number} из ${state.total}`} />
      ) : (
        <span className={styles.cardMeta}>{formatCourseSize(state.total, bank.questions.length)} · не начат</span>
      )}
    </button>
  );
}
