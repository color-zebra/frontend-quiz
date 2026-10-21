import { createContext, use, useEffect, useRef, useState, type ReactNode } from "react";
import { deleteCourse, readAllCourses, writeCourse, type CoursePosition, type CourseProgress } from "./lessonsStore";

interface CourseChange {
  /** Урок, который отмечается освоенным. Отметка не снимается. */
  mastered?: string;
  /** Новое место в курсе; null — курс пройден. Не передано — место не меняется. */
  position?: CoursePosition | null;
  /** Место в озвучке урока; seconds null — дослушан, начинать с начала. */
  audio?: { lessonId: string; seconds: number | null };
}

interface LessonsContextValue {
  /** Прогресс всех наборов — для резервной копии. */
  courses: CourseProgress[];
  getCourse: (setId: string) => CourseProgress | undefined;
  updateCourse: (setId: string, change: CourseChange) => void;
  /** Кнопка «Сбросить прогресс курса»: отметки «освоен» и место удаляются. */
  resetCourse: (setId: string) => void;
  /** Прогресс из резервной копии дописывается к своему. Возвращает, у скольких наборов что-то изменилось. */
  importCourses: (incoming: readonly CourseProgress[]) => number;
}

const LessonsContext = createContext<LessonsContextValue | null>(null);

/**
 * Две копии одного курса: урок освоен, если освоен хоть в одной (время — первое), место — из более свежей.
 * Так повторная загрузка той же копии ничего не меняет.
 */
function mergeCourse(own: CourseProgress | undefined, incoming: CourseProgress): CourseProgress {
  if (!own) return incoming;
  const read = { ...own.read };
  for (const [lessonId, at] of Object.entries(incoming.read)) read[lessonId] = Math.min(read[lessonId] ?? at, at);
  const fresher = incoming.updatedAt > own.updatedAt ? incoming : own;
  return {
    setId: own.setId,
    read,
    position: fresher.position,
    ...(fresher.audio ? { audio: fresher.audio } : {}),
    updatedAt: fresher.updatedAt,
  };
}

/** Место в озвучке урока: секунды округляются — их пишут каждые несколько секунд, лишняя точность не нужна. */
function withAudioPosition(audio: Record<string, number> | undefined, lessonId: string, seconds: number | null) {
  const next = { ...audio };
  if (seconds === null) delete next[lessonId];
  else next[lessonId] = Math.floor(seconds);
  return Object.keys(next).length ? next : undefined;
}

/** Отметки «освоен» и место в курсе для каждого набора с уроками. Ответы режима обучения сюда не попадают. */
export function LessonsProvider({ children }: { children: ReactNode }) {
  const [courses, setCourses] = useState<Map<string, CourseProgress>>(new Map());
  // Ссылка — чтобы два изменения подряд в одном обработчике видели друг друга.
  const coursesRef = useRef(courses);

  function commit(next: Map<string, CourseProgress>) {
    coursesRef.current = next;
    setCourses(next);
  }

  useEffect(() => {
    readAllCourses().then(
      (saved) => {
        // Изменения, сделанные до окончания чтения, свежее прочитанных.
        commit(new Map([...saved.map((c) => [c.setId, c] as const), ...coursesRef.current]));
      },
      // IndexedDB недоступна — прогресс живёт до закрытия вкладки.
      () => undefined,
    );
  }, []);

  function put(progress: CourseProgress) {
    commit(new Map(coursesRef.current).set(progress.setId, progress));
    writeCourse(progress).catch(() => undefined);
  }

  function updateCourse(setId: string, change: CourseChange) {
    const current = coursesRef.current.get(setId) ?? { setId, position: null, read: {}, updatedAt: 0 };
    const now = Date.now();
    const read = change.mastered && !current.read[change.mastered] ? { ...current.read, [change.mastered]: now } : current.read;
    const position = change.position === undefined ? current.position : change.position;
    const audio = change.audio ? withAudioPosition(current.audio, change.audio.lessonId, change.audio.seconds) : current.audio;
    if (
      read === current.read &&
      JSON.stringify(position) === JSON.stringify(current.position) &&
      JSON.stringify(audio) === JSON.stringify(current.audio)
    ) {
      return;
    }
    put({ setId, read, position, ...(audio ? { audio } : {}), updatedAt: now });
  }

  function resetCourse(setId: string) {
    const next = new Map(coursesRef.current);
    next.delete(setId);
    commit(next);
    deleteCourse(setId).catch(() => undefined);
  }

  function importCourses(incoming: readonly CourseProgress[]) {
    let changed = 0;
    for (const course of incoming) {
      const own = coursesRef.current.get(course.setId);
      const merged = mergeCourse(own, course);
      if (JSON.stringify(merged) === JSON.stringify(own)) continue;
      put(merged);
      changed++;
    }
    return changed;
  }

  return (
    <LessonsContext
      value={{
        courses: [...courses.values()],
        getCourse: (setId) => courses.get(setId),
        updateCourse,
        resetCourse,
        importCourses,
      }}
    >
      {children}
    </LessonsContext>
  );
}

export function useLessons() {
  const value = use(LessonsContext);
  if (!value) throw new Error("useLessons вызван вне LessonsProvider");
  return value;
}
