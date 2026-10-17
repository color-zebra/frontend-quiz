import clsx from "clsx";
import { Fragment, useState } from "react";
import type { QuestionBank } from "../../data/types";
import { countRead, getLessonGroups, getLessonQuestionIds, getPosition } from "../../features/lessons/course";
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
import styles from "./Lessons.module.css";

interface CourseScreenProps {
  bank: QuestionBank;
  /** Пришли сюда с последнего урока: сказать, что курс пройден. */
  finished: boolean;
  onBack: () => void;
  onOpenLesson: (lessonId: string) => void;
}

/** «Курс пройден» или сколько уроков остались без отметки. */
function getFinishedText(total: number, read: number) {
  if (read >= total) return "Курс пройден: прочитаны все уроки.";
  const left = total - read;
  return `Это был последний урок. Без отметки «прочитан» ${plural(left, ["остался", "осталось", "осталось"])} ${left} ${plural(left, LESSON_FORMS)} — они в списке ниже.`;
}

/** Оглавление курса: уроки по порядку файла, по разделам, с отметками «прочитан» и местом, где человек остановился. */
export function CourseScreen({ bank, finished, onBack, onOpenLesson }: CourseScreenProps) {
  const { getCourse, resetCourse } = useLessons();
  const [finishedShown, setFinishedShown] = useState(finished);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const lessons = bank.lessons ?? [];
  const progress = getCourse(bank.setId);
  const position = getPosition(bank, progress);
  const read = countRead(lessons, progress);

  return (
    <Screen>
      <TopBar>
        <IconButton icon="arrowLeft" label="Назад" onClick={onBack} />
      </TopBar>

      <ScreenTitle
        title="Оглавление"
        subtitle={`«${bank.title ?? ""}» · ${lessons.length} ${plural(lessons.length, LESSON_FORMS)} · прочитано ${read}`}
      />

      {finishedShown && <Notice kind="ok" text={getFinishedText(lessons.length, read)} onClose={() => setFinishedShown(false)} />}

      {getLessonGroups(lessons).map((group, groupIndex) => (
        <Fragment key={`${groupIndex}-${group.topic ?? ""}`}>
          {group.topic && <SectionLabel className={styles.groupLabel}>{group.topic}</SectionLabel>}
          <ul className={styles.lessonList}>
            {group.lessons.map(({ lesson, number }) => {
              const isRead = !!progress?.read[lesson.id];
              const here = position?.lessonId === lesson.id ? position : null;
              const count = getLessonQuestionIds(bank, lesson).length;
              return (
                <li key={lesson.id}>
                  <button
                    type="button"
                    className={clsx(styles.lessonRow, glass.glass, isRead && styles.read, here && styles.here)}
                    aria-current={here ? "step" : undefined}
                    onClick={() => onOpenLesson(lesson.id)}
                  >
                    <span className={styles.number}>{number}</span>
                    <span className={styles.rowText}>
                      <span className={styles.rowTitle}>{lesson.title}</span>
                      <span className={styles.rowMeta}>
                        {isRead && <span className={styles.readText}>прочитан · </span>}
                        {count ? countQuestions(count) : "без вопросов"}
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

      {(read > 0 || progress?.position) && (
        <Button variant="secondary" icon="refresh" className={styles.reset} onClick={() => setConfirmOpen(true)}>
          Сбросить прогресс курса
        </Button>
      )}

      <Sheet open={confirmOpen} title="Сбросить прогресс курса?" onClose={() => setConfirmOpen(false)}>
        <div className={styles.confirm}>
          <p>
            У всех уроков этого набора снимутся отметки «прочитан», и приложение забудет, где ты остановился: курс
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
