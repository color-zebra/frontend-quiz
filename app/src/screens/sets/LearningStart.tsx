import clsx from "clsx";
import type { QuestionBank } from "../../data/types";
import { countRead, getLessonQuestionIds, getPosition, getStartLesson } from "../../features/lessons/course";
import { useLessons } from "../../features/lessons/LessonsProvider";
import glass from "../../shared/ui/glass.module.css";
import { Icon } from "../../shared/ui/Icon";
import styles from "./LearningStart.module.css";

interface LearningStartProps {
  bank: QuestionBank;
  onOpenLesson: (lessonId: string) => void;
  /** Продолжить вопросы урока с сохранённого номера. */
  onOpenQuiz: (lessonId: string) => void;
  onOpenCourse: () => void;
}

/**
 * Вход в режим обучения у набора с уроками — под «Начать»: стеклянная кнопка, а не вторая яркая, потому что главная
 * кнопка на экране одна. Внутри — какой урок откроется; «Учиться», пока курс не начат или пройден, иначе
 * «Продолжить обучение». Под кнопкой — ссылка на оглавление.
 */
export function LearningStart({ bank, onOpenLesson, onOpenQuiz, onOpenCourse }: LearningStartProps) {
  const { getCourse } = useLessons();
  const lessons = bank.lessons ?? [];
  const progress = getCourse(bank.setId);
  const position = getPosition(bank, progress);
  const read = countRead(lessons, progress);
  const lesson = (position && lessons.find((l) => l.id === position.lessonId)) || getStartLesson(lessons, progress);
  const count = getLessonQuestionIds(bank, lesson).length;
  const inQuiz = position?.step === "quiz" && position.index < count;
  const finished = !position && read === lessons.length;
  const details = finished
    ? `Курс пройден · прочитано ${read} из ${lessons.length}`
    : `урок ${lessons.indexOf(lesson) + 1} из ${lessons.length}${inQuiz ? `, вопрос ${position.index + 1} из ${count}` : ""} · ${lesson.title}`;

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={clsx(styles.start, glass.glass)}
        onClick={() => (inQuiz ? onOpenQuiz(lesson.id) : onOpenLesson(lesson.id))}
      >
        <Icon name="book" className={styles.icon} />
        <span className={styles.text}>
          <span className={styles.action}>{position ? "Продолжить обучение" : "Учиться"}</span>
          <span className={styles.details}>{details}</span>
        </span>
        <Icon name="chevronRight" className={styles.marker} />
      </button>
      <button type="button" className={styles.course} onClick={onOpenCourse}>
        Оглавление
        <Icon name="chevronRight" />
      </button>
    </div>
  );
}
