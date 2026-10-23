import type { CourseFeature, Lesson, QuestionBank } from "../../data/types";
import { CATALOG, findAddedSet, type CatalogEntry } from "../sets/catalog";
import { getSetId, type SetRecord } from "../sets/setsStore";
import { countMastered, getLessonQuestionIds, getPosition, getStartLesson } from "../lessons/course";
import type { CourseProgress } from "../lessons/lessonsStore";
import type { QuestionProgress } from "../progress/types";

/** Курсы каталога — пункты с уроками; наборы без уроков (устная тренировка) курсами не считаются. */
export const CATALOG_COURSES: readonly CatalogEntry[] = CATALOG.filter((entry) => entry.lessons.length > 0);

/** Дополнение к курсу из каталога (устная тренировка к курсу 7). */
export function getCompanion(courseUrl: string) {
  return CATALOG.find((entry) => entry.course === courseUrl);
}

/** Пункт каталога, из которого добавлен набор, — по ссылке. Свой набор по ссылке не из каталога — undefined. */
export function findCatalogEntry(record: SetRecord) {
  return CATALOG.find((entry) => findAddedSet(entry, [record]));
}

/** Место курса в серии: «Системный дизайн фронтенда», курс 1 из 7. */
export function getSeriesPlace(entry: CatalogEntry | undefined) {
  if (!entry?.series) return null;
  const series = CATALOG_COURSES.filter((e) => e.series === entry.series);
  return { name: entry.series, number: series.indexOf(entry) + 1, total: series.length };
}

/**
 * Прогресс курса — отдельно от того, скачан ли он: запись прогресса живёт по id набора и переживает удаление
 * курса с устройства. Удалил ради места — «урок 6 из 19» остаётся, а скачается курс заново — продолжится оттуда же.
 */
export interface CourseProgressSummary {
  total: number;
  mastered: number;
  /** Номер урока, на котором человек (или первого неосвоенного), с единицы. */
  number: number;
  started: boolean;
  finished: boolean;
}

/** id, под которым курс каталога лежит на устройстве и под которым хранится его прогресс. */
export function getEntrySetId(entry: CatalogEntry) {
  return entry.rawUrl ? getSetId(entry.rawUrl) : undefined;
}

/** Прогресс курса каталога по записи прогресса и оглавлению из каталога — файл курса для этого не нужен. */
export function getEntryProgress(entry: CatalogEntry, progress: CourseProgress | undefined): CourseProgressSummary | null {
  const lessons = entry.lessons;
  if (lessons.length === 0) return null;
  const mastered = lessons.filter((l) => progress?.read[l.id]).length;
  const at = progress?.position ? lessons.findIndex((l) => l.id === progress.position!.lessonId) : -1;
  const next = at >= 0 ? at : Math.max(0, lessons.findIndex((l) => !progress?.read[l.id]));
  return {
    total: lessons.length,
    mastered,
    number: next + 1,
    started: at >= 0 || mastered > 0,
    finished: at < 0 && mastered === lessons.length,
  };
}

/** Где человек в курсе и что дальше. */
export interface CourseState extends CourseProgressSummary {
  /** Урок, к которому ведёт «Дальше»: где остановился или первый неосвоенный. */
  lesson: Lesson;
  /** Человек на вопросах этого урока, а не на тексте. */
  inQuiz: boolean;
}

export function getCourseState(bank: QuestionBank, progress: CourseProgress | undefined): CourseState | null {
  const lessons = bank.lessons ?? [];
  if (lessons.length === 0) return null;
  const position = getPosition(bank, progress);
  const mastered = countMastered(lessons, progress);
  const lesson = (position && lessons.find((l) => l.id === position.lessonId)) || getStartLesson(lessons, progress);
  const count = getLessonQuestionIds(bank, lesson).length;
  return {
    total: lessons.length,
    mastered,
    lesson,
    number: lessons.indexOf(lesson) + 1,
    inQuiz: position?.step === "quiz" && position.index < count,
    started: !!position || mastered > 0,
    finished: !position && mastered === lessons.length,
  };
}

/** Освоено вопросов набора — на них отвечали, и они не в ошибках; и сколько ждут повтора. */
export function getQuestionMastery(bank: QuestionBank, getProgress: (id: string) => QuestionProgress | undefined) {
  let mastered = 0;
  const mistakes: string[] = [];
  for (const question of bank.questions) {
    const progress = getProgress(question.id);
    if (progress?.mistake) mistakes.push(question.id);
    else if ((progress?.answered ?? 0) > 0) mastered++;
  }
  return { mastered, total: bank.questions.length, mistakes };
}

/** Значки курса: у добавленного — из его файла, иначе — из каталога. */
export function getFeatures(bank: QuestionBank | undefined, entry: CatalogEntry | undefined): readonly CourseFeature[] {
  return bank?.features ?? entry?.features ?? [];
}

/** Подпись и расшифровка значка — в фильтрах и на странице курса; в списках значок без слов. */
export const FEATURE_INFO: Record<CourseFeature, { icon: "headphones" | "monitor"; label: string; filter: string }> = {
  audio: { icon: "headphones", label: "Озвучен", filter: "Озвучены" },
  computer: { icon: "monitor", label: "Практика за компьютером", filter: "За компьютером" },
};
