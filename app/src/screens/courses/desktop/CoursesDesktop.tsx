import clsx from "clsx";
import { BUILTIN_SET_ID, type QuestionBank } from "../../../data/types";
import { useAudio } from "../../../features/audio/AudioProvider";
import { CATALOG_COURSES, findCatalogEntry, getEntryProgress, getEntrySetId, getFeatures } from "../../../features/courses/courses";
import { useMyCourses, type MyCourse } from "../../../features/courses/useMyCourses";
import { useLessons } from "../../../features/lessons/LessonsProvider";
import { useProgress } from "../../../features/progress/ProgressProvider";
import { getSummary } from "../../../features/progress/summary";
import { UpdateBanner } from "../../../features/pwa/AppUpdate";
import { getLessonQuestionIds } from "../../../features/lessons/course";
import { findAddedSet, type CatalogEntry } from "../../../features/sets/catalog";
import { useSets } from "../../../features/sets/SetsProvider";
import { countQuestions, plural } from "../../../shared/lib/plural";
import { Button } from "../../../shared/ui/Button";
import glass from "../../../shared/ui/glass.module.css";
import { Icon } from "../../../shared/ui/Icon";
import { ProgressRing } from "../../../shared/ui/ProgressRing";
import { Screen } from "../../../shared/ui/Screen";
import { ScreenTitle } from "../../../shared/ui/ScreenTitle";
import { formatCourseSize } from "../CourseBits";
import { cleanDescription, CourseTile, RowSection, SeriesTrack } from "./CourseParts";
import styles from "./Desktop.module.css";

const DAY_FORMS = ["день", "дня", "дней"] as const;

interface CoursesDesktopProps {
  bank: QuestionBank;
  showHint: boolean;
  onHideHint: () => void;
  onOpenHelp: () => void;
  onOpenCourse: (setId: string) => void;
  onOpenPreview: (url: string) => void;
  onOpenAll: () => void;
  onOpenLesson: (setId: string, lessonId: string) => void;
  onOpenLessonQuiz: (setId: string, lessonId: string) => void;
  /** «Прорешать» ошибки тренажёра — сессия по ним. */
  onRetryMistakes: (questionIds: string[]) => void;
}

/**
 * «Курсы» на десктопе: «Продолжить» с кольцом прогресса и «Сегодня» рядом, дальше разделы по одному ряду —
 * дорожка серии, «Мои курсы», остальные курсы. Ни один раздел не выталкивает следующие за край экрана.
 */
export function CoursesDesktop({
  bank,
  showHint,
  onHideHint,
  onOpenHelp,
  onOpenCourse,
  onOpenPreview,
  onOpenAll,
  onOpenLesson,
  onOpenLessonQuiz,
  onRetryMistakes,
}: CoursesDesktopProps) {
  const { sets } = useSets();
  const { getCourse } = useLessons();
  const { records, getProgress } = useProgress();
  const audio = useAudio();
  const { mine, current } = useMyCourses();
  const summary = getSummary(records);
  const mistakes = bank.questions.filter((q) => getProgress(BUILTIN_SET_ID, q.id)?.mistake).map((q) => q.id);

  function entryProgress(entry: CatalogEntry) {
    const setId = getEntrySetId(entry);
    return getEntryProgress(entry, setId ? getCourse(setId) : undefined);
  }

  function openEntry(entry: CatalogEntry) {
    const record = findAddedSet(entry, sets);
    if (record) onOpenCourse(record.id);
    else onOpenPreview(entry.url);
  }

  const seriesName = CATALOG_COURSES.find((e) => e.series)?.series;
  const series = CATALOG_COURSES.filter((e) => e.series === seriesName);
  const more = CATALOG_COURSES.filter((e) => !e.series && !findAddedSet(e, sets));

  return (
    <Screen width="wide" className={styles.page}>
      <div className={styles.head}>
        <ScreenTitle title="Курсы" subtitle="Уроки, озвучка и вопросы для самопроверки" />
        <UpdateBanner />
      </div>

      {showHint && (
        <div className={clsx(styles.continue, glass.glass)} role="note">
          <div className={styles.continueText}>
            <p className={styles.label}>Впервые здесь?</p>
            <p className={styles.meta}>
              Выбери курс: сначала урок, потом вопросы по нему. Курс скачается, когда начнёшь, и дальше работает без
              интернета.
            </p>
          </div>
          <div className={styles.actions}>
            <Button
              variant="secondary"
              onClick={() => {
                onHideHint();
                onOpenHelp();
              }}
            >
              Как устроена Зубрилка
            </Button>
            <Button variant="secondary" icon="close" onClick={onHideHint}>
              Скрыть
            </Button>
          </div>
        </div>
      )}

      {(current || summary.answers > 0) && (
        <div className={styles.hero}>
          {current && (
            <ContinueCard
              course={current}
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
          {summary.answers > 0 && (
            <section className={clsx(styles.today, glass.glass)} aria-label="Сегодня">
              <p className={styles.label}>Сегодня</p>
              <div className={styles.streak}>
                <span className={styles.streakIcon}>
                  <Icon name="trophy" />
                </span>
                <span>
                  <b className={styles.streakValue}>{summary.days}</b>
                  <span className={styles.meta}>
                    {plural(summary.days, DAY_FORMS)} подряд
                  </span>
                </span>
              </div>
              <span className={styles.meta}>
                За неделю {summary.weekAnswers} {plural(summary.weekAnswers, ["ответ", "ответа", "ответов"])}
                {summary.weekAnswers > 0 && `, верно ${summary.weekAccuracy}%`}
              </span>
              <div className={styles.mistakes}>
                <span>
                  <b>{mistakes.length ? `Ошибки · ${mistakes.length}` : "Ошибок нет"}</b>
                  <span className={styles.meta}>{mistakes.length ? "в тренажёре — пора прорешать" : "в тренажёре всё чисто"}</span>
                </span>
                {mistakes.length > 0 && (
                  <Button variant="secondary" onClick={() => onRetryMistakes(mistakes)}>
                    Прорешать
                  </Button>
                )}
              </div>
            </section>
          )}
        </div>
      )}

      {seriesName && (
        <SeriesTrack
          name={seriesName}
          steps={series.map((entry) => {
            const record = findAddedSet(entry, sets);
            return { entry, features: entry.features, progress: entryProgress(entry), downloaded: !!record };
          })}
          onOpen={openEntry}
        />
      )}

      {mine.length > 0 && (
        <RowSection
          id="courses-mine"
          title="Мои курсы"
          count={mine.length}
          items={mine.map((course) => (
            <MyCourseTile key={course.record.id} course={course} onOpen={() => onOpenCourse(course.record.id)} />
          ))}
        />
      )}

      <RowSection
        id="courses-more"
        title={mine.length ? "Ещё курсы" : "С чего начать"}
        link={{ label: `Все курсы · ${CATALOG_COURSES.length}`, onClick: onOpenAll }}
        items={more.map((entry) => (
          <CourseTile
            key={entry.url}
            title={entry.title}
            description={cleanDescription(entry.description)}
            features={entry.features}
            progress={entryProgress(entry)}
            meta={formatCourseSize(entry.lessons.length, entry.count)}
            onClick={() => onOpenPreview(entry.url)}
          />
        ))}
      />
    </Screen>
  );
}

interface ContinueCardProps {
  course: MyCourse;
  playing: boolean;
  onRead: () => void;
  onListen: () => void;
}

function ContinueCard({ course, playing, onRead, onListen }: ContinueCardProps) {
  const { state, bank } = course;
  const count = getLessonQuestionIds(bank, state.lesson).length;
  const questions = count ? countQuestions(count) : "";
  return (
    <section className={clsx(styles.continue, glass.glass)} aria-label="Продолжить">
      <div className={styles.continueText}>
        <p className={styles.label}>Продолжить</p>
        <span className={styles.meta}>
          {bank.title} · урок {state.number} из {state.total}
        </span>
        <h2 className={styles.continueTitle}>{state.lesson.title}</h2>
        <span className={styles.meta}>
          {[state.lesson.topic, state.inQuiz ? "ты на вопросах урока" : questions, state.lesson.audio && "есть озвучка"].filter(Boolean).join(" · ")}
        </span>
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
      </div>
      <span className={styles.continueRing}>
        <ProgressRing value={state.mastered} total={state.total}>
          уроков освоено
        </ProgressRing>
      </span>
    </section>
  );
}

function MyCourseTile({ course, onOpen }: { course: MyCourse; onOpen: () => void }) {
  const { record, bank, state } = course;
  const entry = findCatalogEntry(record);
  return (
    <CourseTile
      title={bank.title ?? "Курс"}
      description={cleanDescription(entry?.description)}
      features={getFeatures(bank, entry)}
      progress={state}
      meta={formatCourseSize(state.total, bank.questions.length)}
      downloaded
      mine={!entry}
      onClick={onOpen}
    />
  );
}
