import { useState } from "react";
import type { Question, QuestionBank } from "../../data/types";
import { getLessonQuestionIds, getPosition } from "../../features/lessons/course";
import { useLessons } from "../../features/lessons/LessonsProvider";
import {
  getIsLastQuestion,
  giveUp,
  goToNextQuestion,
  selectOption,
  startOrderedSession,
  submitAnswer,
  type Session,
} from "../../features/session/session";
import { Button, IconButton } from "../../shared/ui/Button";
import { Card } from "../../shared/ui/Card";
import { Screen, TopBar } from "../../shared/ui/Screen";
import { ScreenTitle } from "../../shared/ui/ScreenTitle";
import { SessionScreen } from "../session/SessionScreen";
import styles from "./Lessons.module.css";

interface LessonQuizScreenProps {
  bank: QuestionBank;
  lessonId: string;
  /** Крестик и системная «Назад» — обратно к тексту урока. */
  onBack: () => void;
  onNextLesson: (lessonId: string) => void;
  onOpenCourse: () => void;
  /** Вопросы последнего урока пройдены: курс пройден. */
  onFinishCourse: () => void;
}

interface QuizState {
  session: Session;
  /** Верных ответов, включая данные до перерыва: «Продолжить обучение» возвращает к номеру вопроса. */
  correct: number;
  done: boolean;
}

/**
 * Вопросы урока — тот же экран вопроса, что в тренировке, но со своим управлением: ответы не уходят в ленту,
 * поэтому не меняют статистику, «Ошибки», «Новые» и достижения и не трогают сохранённую тренировку на главной.
 * На устройство пишется только место в курсе — номер вопроса.
 */
export function LessonQuizScreen({ bank, lessonId, onBack, onNextLesson, onOpenCourse, onFinishCourse }: LessonQuizScreenProps) {
  const { getCourse, updateCourse } = useLessons();
  const lessons = bank.lessons ?? [];
  const index = lessons.findIndex((l) => l.id === lessonId);
  const lesson = lessons[index];
  const ids = lesson ? getLessonQuestionIds(bank, lesson) : [];
  const next = lessons[index + 1];

  const [quiz, setQuiz] = useState<QuizState | null>(() => {
    if (ids.length === 0) return null;
    const position = getPosition(bank, getCourse(bank.setId));
    const saved = position?.lessonId === lessonId && position.step === "quiz" ? position : null;
    if (saved && saved.index >= ids.length) {
      return { session: startOrderedSession(bank, ids, ids.length - 1), correct: saved.correct, done: true };
    }
    return { session: startOrderedSession(bank, ids, saved?.index ?? 0), correct: saved?.correct ?? 0, done: false };
  });

  if (!lesson || !quiz) {
    return (
      <Screen>
        <TopBar>
          <IconButton icon="arrowLeft" label="Назад" onClick={onBack} />
        </TopBar>
        <p className={styles.missing}>У этого урока больше нет вопросов — их убрали при обновлении набора.</p>
      </Screen>
    );
  }

  /** Ответ дан: запомнить, с какого вопроса продолжать, если приложение закроют. */
  function apply(session: Session) {
    if (!quiz) return;
    const answer = session.answers.length > quiz.session.answers.length ? session.answers[session.answers.length - 1] : null;
    const correct = quiz.correct + (answer?.correct ? 1 : 0);
    setQuiz({ ...quiz, session, correct });
    if (answer) {
      updateCourse(bank.setId, { position: { lessonId, step: "quiz", index: session.index + 1, correct } });
    }
  }

  function goNext() {
    if (!quiz || !quiz.session.answered) return;
    if (getIsLastQuestion(quiz.session)) {
      setQuiz({ ...quiz, done: true });
      // Вопросы пройдены: «Продолжить обучение» поведёт к следующему уроку.
      updateCourse(bank.setId, { position: next ? { lessonId: next.id, step: "lesson" } : null });
    } else {
      setQuiz({ ...quiz, session: goToNextQuestion(bank, quiz.session) });
    }
    window.scrollTo(0, 0);
  }

  function restart() {
    setQuiz({ session: startOrderedSession(bank, ids), correct: 0, done: false });
    updateCourse(bank.setId, { position: { lessonId, step: "quiz", index: 0, correct: 0 } });
    window.scrollTo(0, 0);
  }

  if (quiz.done) {
    return (
      <Screen>
        <TopBar>
          <IconButton icon="arrowLeft" label="Назад к уроку" onClick={onBack} />
        </TopBar>
        <ScreenTitle title="Вопросы урока" subtitle={lesson.title} />
        <Card className={styles.score}>
          <span className={styles.scoreValue}>
            Верно {quiz.correct} из {ids.length}
          </span>
          <span className={styles.scoreHint}>Ответы в режиме обучения не идут в статистику и в «Ошибки».</span>
        </Card>
        <div className={styles.lessonNav}>
          {next ? (
            <Button iconAfter="arrowRight" onClick={() => onNextLesson(next.id)}>
              Следующий урок
            </Button>
          ) : (
            <Button iconAfter="check" onClick={onFinishCourse}>
              Завершить курс
            </Button>
          )}
          <Button variant="secondary" icon="refresh" onClick={restart}>
            Пройти вопросы ещё раз
          </Button>
          <Button variant="secondary" icon="list" onClick={onOpenCourse}>
            К оглавлению
          </Button>
        </div>
      </Screen>
    );
  }

  const { session } = quiz;
  return (
    <SessionScreen
      bank={bank}
      session={session}
      learning
      onSelect={(question: Question, optionIndex: number) => apply(selectOption(session, question, optionIndex))}
      onSubmit={(question) => apply(submitAnswer(session, question))}
      onGiveUp={(question) => apply(giveUp(session, question))}
      // Устных вопросов в уроках нет: уроки бывают только у тестовых наборов.
      onGrade={() => undefined}
      onNext={goNext}
      onExit={onBack}
    />
  );
}
