import { createStore, del, entries, set } from "idb-keyval";

/** Где человек остановился в курсе: читает урок или отвечает на его вопросы. */
export type CoursePosition =
  | { lessonId: string; step: "lesson" }
  | {
      lessonId: string;
      step: "quiz";
      /** Номер вопроса урока, с которого продолжить, — с нуля. */
      index: number;
      /** Сколько верных ответов до него: для итога «верно X из N». */
      correct: number;
    };

/** Прогресс обучения по одному набору. Ответы режима обучения здесь не хранятся — только отметки и место. */
export interface CourseProgress {
  setId: string;
  /** null — курс не начат или пройден до конца. */
  position: CoursePosition | null;
  /**
   * id урока → когда урок освоен, мс с 1970 года. Поле называется read исторически: раньше отметка была «прочитан».
   * Старые отметки засчитаны как «освоен» — так решил автор, переносить их не нужно.
   */
  read: Record<string, number>;
  updatedAt: number;
}

// Отдельная база IndexedDB: idb-keyval держит одно хранилище на базу. Ключ записи — id набора.
const store = createStore("frontend-quiz-lessons", "progress");

function isPosition(value: unknown): value is CoursePosition {
  const p = value as Partial<{ lessonId: unknown; step: unknown; index: unknown; correct: unknown }> | null;
  if (!p || typeof p.lessonId !== "string") return false;
  if (p.step === "lesson") return true;
  return p.step === "quiz" && typeof p.index === "number" && p.index >= 0 && typeof p.correct === "number";
}

/** Проверка записи — и с устройства, и из резервной копии. */
export function isCourseProgress(value: unknown): value is CourseProgress {
  const p = value as Partial<CourseProgress> | null;
  return (
    !!p &&
    typeof p.setId === "string" &&
    typeof p.updatedAt === "number" &&
    (p.position === null || isPosition(p.position)) &&
    !!p.read &&
    typeof p.read === "object" &&
    Object.values(p.read).every((at) => typeof at === "number")
  );
}

export async function readAllCourses(): Promise<CourseProgress[]> {
  const all = await entries<string, unknown>(store);
  return all.map(([, value]) => value).filter(isCourseProgress);
}

export function writeCourse(progress: CourseProgress) {
  return set(progress.setId, progress, store);
}

export function deleteCourse(setId: string) {
  return del(setId, store);
}
