import type { Lesson, QuestionBank } from "../../data/types";
import type { CoursePosition, CourseProgress } from "./lessonsStore";

/** Раздел оглавления: подряд идущие уроки с одним topic. У уроков без topic раздела нет. */
export interface LessonGroup {
  topic: string | undefined;
  lessons: { lesson: Lesson; number: number }[];
}

export function getLessonGroups(lessons: readonly Lesson[]): LessonGroup[] {
  const groups: LessonGroup[] = [];
  lessons.forEach((lesson, index) => {
    const last = groups[groups.length - 1];
    const item = { lesson, number: index + 1 };
    if (last && last.topic === lesson.topic) last.lessons.push(item);
    else groups.push({ topic: lesson.topic, lessons: [item] });
  });
  return groups;
}

/** Вопросы урока, которые есть в наборе. Набор обновили и вопрос удалили — его просто нет. */
export function getLessonQuestionIds(bank: QuestionBank, lesson: Lesson) {
  return lesson.questionIds.filter((id) => bank.byId.has(id));
}

/** Урок освоен: его вопросы пройдены без ошибок за один проход (урок без вопросов — закрыт кнопкой «дальше»). */
export function isMastered(progress: CourseProgress | undefined, lessonId: string) {
  return !!progress?.read[lessonId];
}

/** Сколько уроков набора освоено. Отметки удалённых уроков не считаются. */
export function countMastered(lessons: readonly Lesson[], progress: CourseProgress | undefined) {
  return lessons.filter((l) => isMastered(progress, l.id)).length;
}

/**
 * Сохранённое место, если с ним ещё можно продолжить: урок есть в наборе, номер вопроса — в пределах его вопросов.
 * Урок удалили при обновлении набора — места нет, и «Учиться» начнёт с первого неосвоенного.
 */
export function getPosition(bank: QuestionBank, progress: CourseProgress | undefined): CoursePosition | null {
  const position = progress?.position;
  if (!position) return null;
  const lesson = bank.lessons?.find((l) => l.id === position.lessonId);
  if (!lesson) return null;
  if (position.step === "lesson") return position;
  const count = getLessonQuestionIds(bank, lesson).length;
  if (count === 0) return { lessonId: lesson.id, step: "lesson" };
  return { ...position, index: Math.min(position.index, count) };
}

/** С какого урока начать, если места нет: первый неосвоенный, а если освоены все — первый. */
export function getStartLesson(lessons: readonly Lesson[], progress: CourseProgress | undefined) {
  return lessons.find((l) => !isMastered(progress, l.id)) ?? lessons[0];
}
