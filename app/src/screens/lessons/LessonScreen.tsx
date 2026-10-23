import { useEffect } from "react";
import type { Lesson, QuestionBank } from "../../data/types";
import { formatAudioTime, useAudio } from "../../features/audio/AudioProvider";
import { getLessonQuestionIds } from "../../features/lessons/course";
import { useLessons } from "../../features/lessons/LessonsProvider";
import { useSetUrl } from "../../features/sets/SetsProvider";
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
  /** Последний урок без вопросов закрыт: курс пройден. */
  onFinishCourse: () => void;
}

/**
 * Урок: раздел и название, текст, внизу — дальше и «Предыдущий урок». Освоенным урок становится, когда его вопросы
 * пройдены без ошибок за один проход; урок без вопросов — когда его закрыли кнопкой «Следующий урок».
 */
export function LessonScreen({ bank, lessonId, onBack, onOpenCourse, onOpenLesson, onOpenQuiz, onFinishCourse }: LessonScreenProps) {
  const { getCourse, updateCourse } = useLessons();
  const baseUrl = useSetUrl(bank.setId);
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
      // «К вопросам» ничего не отмечает: урок осваивают вопросы без ошибок.
      updateCourse(bank.setId, {
        position: resumeIndex && quizPosition ? quizPosition : { lessonId: lesson.id, step: "quiz", index: 0, correct: 0 },
      });
      onOpenQuiz();
    } else if (next) {
      // Урок без вопросов проверить нечем — освоен, когда его закрыли.
      updateCourse(bank.setId, { mastered: lesson.id, position: { lessonId: next.id, step: "lesson" } });
      onOpenLesson(next.id);
    } else {
      updateCourse(bank.setId, { mastered: lesson.id, position: null });
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

      {lesson.audio && <ListenButton bank={bank} lesson={lesson} audio={lesson.audio} />}

      <LessonMarkdown text={lesson.body} baseUrl={baseUrl} />

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

/**
 * «Слушать урок» под заголовком. Урок уже начинали слушать — «Продолжить слушать · с 3:20»; играет он сейчас —
 * «Пауза». Сам звук — в общем плеере приложения: уйдёшь с урока, а он продолжит играть.
 */
function ListenButton({ bank, lesson, audio: src }: { bank: QuestionBank; lesson: Lesson; audio: string }) {
  const audio = useAudio();
  const { getCourse } = useLessons();
  const current = audio.track?.setId === bank.setId && audio.track.lessonId === lesson.id;
  const from = current ? (audio.ended ? 0 : audio.time) : (getCourse(bank.setId)?.audio?.[lesson.id] ?? 0);

  if (current && audio.playing) {
    return (
      <Button variant="secondary" icon="pause" onClick={audio.pause}>
        Пауза
      </Button>
    );
  }
  return (
    <Button
      variant="secondary"
      icon="headphones"
      onClick={() => audio.play({ setId: bank.setId, lessonId: lesson.id, src, title: lesson.title, course: bank.title ?? "" })}
    >
      {from >= 1 ? `Продолжить слушать · с ${formatAudioTime(from)}` : "Слушать урок"}
    </Button>
  );
}
