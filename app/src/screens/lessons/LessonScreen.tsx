import { useEffect } from "react";
import type { QuestionBank } from "../../data/types";
import { getLessonQuestionIds } from "../../features/lessons/course";
import { useLessons } from "../../features/lessons/LessonsProvider";
import { useSets } from "../../features/sets/SetsProvider";
import { Button, IconButton } from "../../shared/ui/Button";
import { Screen, TopBar } from "../../shared/ui/Screen";
import { ScreenTitle } from "../../shared/ui/ScreenTitle";
import { LessonMarkdown } from "./LessonMarkdown";
import styles from "./Lessons.module.css";

interface LessonScreenProps {
  bank: QuestionBank;
  lessonId: string;
  onBack: () => void;
  onOpenCourse: () => void;
  /** Соседний урок — на место этого, без новой записи в истории. */
  onOpenLesson: (lessonId: string) => void;
  onOpenQuiz: () => void;
  /** Последний урок без вопросов прочитан: курс пройден. */
  onFinishCourse: () => void;
}

/**
 * Урок: раздел и название, текст, внизу — дальше и «Предыдущий урок». Прочитанным урок становится только по кнопке
 * «К вопросам» или «Следующий урок»: по прокрутке не угадать, дочитал ли человек.
 */
export function LessonScreen({ bank, lessonId, onBack, onOpenCourse, onOpenLesson, onOpenQuiz, onFinishCourse }: LessonScreenProps) {
  const { getCourse, updateCourse } = useLessons();
  const { sets } = useSets();
  const lessons = bank.lessons ?? [];
  const index = lessons.findIndex((l) => l.id === lessonId);
  const lesson = lessons[index];
  const position = getCourse(bank.setId)?.position;
  // Ушёл из вопросов перечитать урок — номер вопроса не теряем: кнопка внизу продолжит с него.
  const quizPosition = position?.lessonId === lessonId && position.step === "quiz" ? position : null;

  // Открытый урок — новое место в курсе, «Продолжить обучение» вернёт сюда.
  useEffect(() => {
    if (!lesson || quizPosition) return;
    updateCourse(bank.setId, { position: { lessonId: lesson.id, step: "lesson" } });
    // Только при открытии урока: место потом меняют кнопки.
  }, [bank.setId, lesson?.id]);

  if (!lesson) {
    return (
      <Screen>
        <TopBar>
          <IconButton icon="arrowLeft" label="Назад" onClick={onBack} />
        </TopBar>
        <p className={styles.missing}>Этого урока больше нет в наборе — его убрали при обновлении.</p>
      </Screen>
    );
  }

  const count = getLessonQuestionIds(bank, lesson).length;
  const previous = lessons[index - 1];
  const next = lessons[index + 1];
  // Вопросы начаты, но не закончены — продолжить с того же; ответил на все или не начинал — заново с первого.
  const resumeIndex = quizPosition && quizPosition.index > 0 && quizPosition.index < count ? quizPosition.index : 0;

  function goForward() {
    if (count > 0) {
      updateCourse(bank.setId, {
        read: lesson.id,
        position: resumeIndex && quizPosition ? quizPosition : { lessonId: lesson.id, step: "quiz", index: 0, correct: 0 },
      });
      onOpenQuiz();
    } else if (next) {
      updateCourse(bank.setId, { read: lesson.id, position: { lessonId: next.id, step: "lesson" } });
      onOpenLesson(next.id);
    } else {
      updateCourse(bank.setId, { read: lesson.id, position: null });
      onFinishCourse();
    }
  }

  const forwardLabel =
    count > 0
      ? resumeIndex
        ? `Продолжить вопросы · ${resumeIndex + 1} из ${count}`
        : `К вопросам (${count})`
      : next
        ? "Следующий урок"
        : "Завершить курс";

  return (
    <Screen>
      <TopBar>
        <IconButton icon="arrowLeft" label="Назад" onClick={onBack} />
        <IconButton icon="list" label="Оглавление" onClick={onOpenCourse} />
      </TopBar>

      <ScreenTitle
        title={lesson.title}
        subtitle={`${lesson.topic ? `${lesson.topic} · ` : ""}урок ${index + 1} из ${lessons.length}`}
      />

      <LessonMarkdown text={lesson.body} baseUrl={sets.find((s) => s.id === bank.setId)?.url} />

      <div className={styles.lessonNav}>
        <Button iconAfter={count > 0 || next ? "arrowRight" : "check"} onClick={goForward}>
          {forwardLabel}
        </Button>
        {previous && (
          <Button variant="secondary" icon="arrowLeft" onClick={() => onOpenLesson(previous.id)}>
            Предыдущий урок
          </Button>
        )}
      </div>
    </Screen>
  );
}
