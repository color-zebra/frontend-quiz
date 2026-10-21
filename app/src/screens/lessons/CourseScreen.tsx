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
import { CourseAudio } from "./CourseAudio";
import styles from "./Lessons.module.css";

interface CourseScreenProps {
  bank: QuestionBank;
  /** Пришли сюда с последнего урока: сказать, что курс пройден. */
  finished: boolean;
  onBack: () => void;
  onOpenLesson: (lessonId: string) => void;
}

/** «Курс пройден» — только когда освоены все уроки; иначе — сколько ещё осваивать. */
function getFinishedText(total: number, mastered: number) {
  if (mastered >= total) return "Курс пройден: все уроки освоены.";
  const left = total - mastered;
  return `Это был последний урок. Не ${plural(left, ["освоен", "освоены", "освоены"])} ещё ${left} ${plural(left, LESSON_FORMS)} — они в списке без отметки: пройди их вопросы без ошибок.`;
}

/** Оглавление курса: уроки по порядку файла, по разделам, с отметками «освоен» и местом, где человек остановился. */
export function CourseScreen({ bank, finished, onBack, onOpenLesson }: CourseScreenProps) {
  const { getCourse, resetCourse } = useLessons();
  const { isStored } = useAudioDownloads();
  const [finishedShown, setFinishedShown] = useState(finished);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const lessons = bank.lessons ?? [];
  const progress = getCourse(bank.setId);
  const position = getPosition(bank, progress);
  const mastered = countMastered(lessons, progress);

  return (
    <Screen>
      <TopBar>
        <IconButton icon="arrowLeft" label="Назад" onClick={onBack} />
      </TopBar>

      <ScreenTitle
        title="Оглавление"
        subtitle={`«${bank.title ?? ""}» · ${lessons.length} ${plural(lessons.length, LESSON_FORMS)} · освоено ${mastered}`}
      />

      {finishedShown && <Notice kind="ok" text={getFinishedText(lessons.length, mastered)} onClose={() => setFinishedShown(false)} />}

      <CourseAudio setId={bank.setId} />

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
              Отмена
            </Button>
            <Button
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
