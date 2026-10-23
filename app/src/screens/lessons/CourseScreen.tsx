import clsx from "clsx";
import { Fragment, useState } from "react";
import type { QuestionBank } from "../../data/types";
import { countMastered, getLessonGroups, getLessonQuestionIds, getPosition, isMastered } from "../../features/lessons/course";
import { useAudioDownloads } from "../../features/audio/AudioDownloadsProvider";
import { useLessons } from "../../features/lessons/LessonsProvider";
import { countQuestions, LESSON_FORMS, plural } from "../../shared/lib/plural";
import { Button, IconButton } from "../../shared/ui/Button";
import { SectionLabel } from "../../shared/ui/Card";
import glass from "../../shared/ui/glass.module.css";
import { Icon } from "../../shared/ui/Icon";
import { Notice } from "../../shared/ui/Notice";
import { Screen, TopBar } from "../../shared/ui/Screen";
import { ScreenTitle } from "../../shared/ui/ScreenTitle";
import { Sheet } from "../../shared/ui/Sheet";
import { useAudio } from "../../features/audio/AudioProvider";
import {
  findCatalogEntry,
  getCompanion,
  getCourseState,
  getFeatures,
  getQuestionMastery,
  getSeriesPlace,
} from "../../features/courses/courses";
import { useCatalogAdd } from "../../features/courses/useCatalogAdd";
import { useProgress } from "../../features/progress/ProgressProvider";
import { findAddedSet } from "../../features/sets/catalog";
import { useSets } from "../../features/sets/SetsProvider";
import { formatTasks } from "../courses/AllCoursesScreen";
import { FeatureBadge, formatCourseSize, ProgressLine } from "../courses/CourseBits";
import courses from "../courses/Courses.module.css";
import { CourseAudio } from "./CourseAudio";
import styles from "./Lessons.module.css";

interface CourseScreenProps {
  bank: QuestionBank;
  /** Пришли сюда с последнего урока: сказать, что курс пройден. */
  finished: boolean;
  onBack: () => void;
  onOpenLesson: (lessonId: string) => void;
  /** Продолжить вопросы урока с сохранённого номера. */
  onOpenQuiz: (lessonId: string) => void;
  /** «Вопросы курса»: тренировка по всем вопросам набора — все, новые или ошибки. */
  onOpenQuestions: () => void;
  /** «Повторить ошибки» пройденного курса. */
  onRetryMistakes: (questionIds: string[]) => void;
  /** Открыть набор (устную тренировку к курсу). */
  onOpenSet: (setId: string) => void;
}

/** «Курс пройден» — только когда освоены все уроки; иначе — сколько ещё осваивать. */
function getFinishedText(total: number, mastered: number) {
  if (mastered >= total) return "Курс пройден: все уроки освоены.";
  const left = total - mastered;
  return `Это был последний урок. Не ${plural(left, ["освоен", "освоены", "освоены"])} ещё ${left} ${plural(left, LESSON_FORMS)} — они в списке без отметки: пройди их вопросы без ошибок.`;
}

/**
 * Страница курса: где человек и что дальше («Читать урок», «Слушать»; пройден — «Повторить ошибки»), вход в вопросы
 * курса и устную тренировку, аудио курса и оглавление — уроки по порядку файла, по разделам, с отметками «освоен»
 * и местом, где человек остановился.
 */
export function CourseScreen({
  bank,
  finished,
  onBack,
  onOpenLesson,
  onOpenQuiz,
  onOpenQuestions,
  onRetryMistakes,
  onOpenSet,
}: CourseScreenProps) {
  const { getCourse, resetCourse } = useLessons();
  const { getProgress } = useProgress();
  const { sets } = useSets();
  const audio = useAudio();
  const companionAdd = useCatalogAdd();
  const { isStored } = useAudioDownloads();
  const [finishedShown, setFinishedShown] = useState(finished);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const lessons = bank.lessons ?? [];
  const progress = getCourse(bank.setId);
  const position = getPosition(bank, progress);
  const mastered = countMastered(lessons, progress);
  const state = getCourseState(bank, progress);
  const record = sets.find((r) => r.id === bank.setId);
  const entry = record && findCatalogEntry(record);
  const series = getSeriesPlace(entry);
  const features = getFeatures(bank, entry);
  const questions = getQuestionMastery(bank, (id) => getProgress(bank.setId, id));
  const companion = entry && getCompanion(entry.url);
  const companionRecord = companion && findAddedSet(companion, sets);
  const next = state?.lesson;
  const playing = !!next && audio.playing && audio.track?.setId === bank.setId && audio.track.lessonId === next.id;

  async function openCompanion() {
    if (!companion) return;
    if (companionRecord) {
      onOpenSet(companionRecord.id);
      return;
    }
    const added = await companionAdd.add(companion);
    if (added) onOpenSet(added.id);
  }

  return (
    <Screen>
      <TopBar>
        <IconButton icon="arrowLeft" label="Назад" onClick={onBack} />
      </TopBar>

      {series && (
        <p className={courses.eyebrow}>
          {series.name} · курс {series.number} из {series.total}
        </p>
      )}
      <ScreenTitle title={bank.title ?? "Курс"} />
      <div className={courses.badgeRow}>
        {features.map((f) => (
          <FeatureBadge key={f} feature={f} />
        ))}
        {!entry && <span className={courses.mine}>свой</span>}
        <span>{formatCourseSize(lessons.length, bank.questions.length)}</span>
      </div>

      {finishedShown && <Notice kind="ok" text={getFinishedText(lessons.length, mastered)} onClose={() => setFinishedShown(false)} />}

      <div className={clsx(courses.tiles, glass.glass)}>
        <div className={courses.tile}>
          <span className={courses.tileLabel}>Уроки освоены</span>
          <span className={courses.tileValue}>
            {mastered} из {lessons.length}
          </span>
          <ProgressLine value={mastered} total={lessons.length} />
        </div>
        <div className={courses.tile}>
          <span className={courses.tileLabel}>Вопросы освоены</span>
          <span className={courses.tileValue}>
            {questions.mastered} из {questions.total}
          </span>
          <ProgressLine value={questions.mastered} total={questions.total} tone="ok" />
        </div>
      </div>

      {state && next && !state.finished && (
        <section className={clsx(courses.continue, glass.glass)} aria-label="Дальше">
          <SectionLabel className={courses.label}>{state.started ? "Дальше" : "Начать"}</SectionLabel>
          <h2 className={courses.continueLesson}>
            Урок {state.number} · {next.title}
          </h2>
          <div className={courses.actions}>
            <Button iconAfter="arrowRight" onClick={() => (state.inQuiz ? onOpenQuiz(next.id) : onOpenLesson(next.id))}>
              {state.inQuiz ? "К вопросам" : "Читать урок"}
            </Button>
            {next.audio && (
              <Button
                variant="secondary"
                icon={playing ? "pause" : "headphones"}
                onClick={() =>
                  playing
                    ? audio.pause()
                    : audio.play({ setId: bank.setId, lessonId: next.id, src: next.audio!, title: next.title, course: bank.title ?? "" })
                }
              >
                {playing ? "Пауза" : "Слушать"}
              </Button>
            )}
          </div>
        </section>
      )}

      {state?.finished && (
        <section className={clsx(courses.continue, glass.glass)} aria-label="Курс пройден">
          <SectionLabel className={courses.label}>Курс пройден</SectionLabel>
          <h2 className={courses.continueLesson}>
            {questions.mistakes.length
              ? `${questions.mistakes.length} ${plural(questions.mistakes.length, ["ошибка ждёт", "ошибки ждут", "ошибок ждут"])} повтора`
              : "Все уроки освоены, ошибок нет"}
          </h2>
          {questions.mistakes.length > 0 && (
            <Button icon="refresh" onClick={() => onRetryMistakes(questions.mistakes)}>
              Повторить ошибки · {questions.mistakes.length}
            </Button>
          )}
        </section>
      )}

      <button type="button" className={clsx(courses.linkRow, glass.glass)} onClick={onOpenQuestions}>
        <Icon name="target" />
        <span className={courses.linkText}>
          <span className={courses.linkTitle}>Вопросы курса</span>
          <span className={courses.linkSub}>Тренировка: все, новые или ошибки</span>
        </span>
        <Icon name="chevronRight" className={courses.chevron} />
      </button>

      {companion && (
        <>
          <button type="button" className={clsx(courses.linkRow, glass.glass)} disabled={!!companionAdd.busyUrl} onClick={openCompanion}>
            <Icon name="mic" />
            <span className={courses.linkText}>
              <span className={courses.linkTitle}>Устная тренировка к курсу</span>
              <span className={courses.linkSub}>
                {companionAdd.busyUrl ? "Скачиваем…" : `${formatTasks(companion.count ?? 0)} для ответа вслух`}
              </span>
            </span>
            <Icon name="chevronRight" className={courses.chevron} />
          </button>
          {companionAdd.message && (
            <Notice kind={companionAdd.message.kind} text={companionAdd.message.text} onClose={companionAdd.clearMessage} />
          )}
        </>
      )}

      <CourseAudio setId={bank.setId} />

      <h2 className={courses.tocHeading}>Оглавление</h2>

      {getLessonGroups(lessons).map((group, groupIndex) => (
        <Fragment key={`${groupIndex}-${group.topic ?? ""}`}>
          {group.topic && <SectionLabel className={styles.groupLabel}>{group.topic}</SectionLabel>}
          <ul className={styles.lessonList}>
            {group.lessons.map(({ lesson, number }) => {
              const done = isMastered(progress, lesson.id);
              const here = position?.lessonId === lesson.id ? position : null;
              const count = getLessonQuestionIds(bank, lesson).length;
              return (
                <li key={lesson.id}>
                  <button
                    type="button"
                    className={clsx(styles.lessonRow, glass.glass, done && styles.mastered, here && styles.here)}
                    aria-current={here ? "step" : undefined}
                    onClick={() => onOpenLesson(lesson.id)}
                  >
                    <span className={styles.number}>{number}</span>
                    <span className={styles.rowText}>
                      <span className={styles.rowTitle}>{lesson.title}</span>
                      <span className={styles.rowMeta}>
                        {done && <span className={styles.masteredText}>освоен · </span>}
                        {count ? countQuestions(count) : "без вопросов"}
                        {lesson.audio && (
                          <span className={styles.audioMark}>{isStored(lesson.audio) ? " · аудио на телефоне" : " · аудио"}</span>
                        )}
                        {lesson.computer && <span className={courses.computer}> · за компьютером</span>}
                        {here && (
                          <span className={styles.hereText}>
                            {" · "}
                            {here.step === "quiz" ? `ты здесь, вопрос ${Math.min(here.index + 1, count)} из ${count}` : "ты здесь"}
                          </span>
                        )}
                      </span>
                    </span>
                    <Icon name="chevronRight" className={styles.rowMarker} />
                  </button>
                </li>
              );
            })}
          </ul>
        </Fragment>
      ))}

      {(mastered > 0 || progress?.position) && (
        <Button variant="secondary" icon="refresh" className={styles.reset} onClick={() => setConfirmOpen(true)}>
          Сбросить прогресс курса
        </Button>
      )}

      <Sheet open={confirmOpen} title="Сбросить прогресс курса?" onClose={() => setConfirmOpen(false)}>
        <div className={styles.confirm}>
          <p>
            У всех уроков этого набора снимутся отметки «освоен», и приложение забудет, где ты остановился: курс
            начнётся с первого урока. Заметки, закладки и статистика останутся. Отменить сброс нельзя.
          </p>
          <div className={styles.confirmButtons}>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Оставить
            </Button>
            <Button
              variant="danger"
              icon="refresh"
              onClick={() => {
                resetCourse(bank.setId);
                setFinishedShown(false);
                setConfirmOpen(false);
              }}
            >
              Сбросить
            </Button>
          </div>
        </div>
      </Sheet>
    </Screen>
  );
}
