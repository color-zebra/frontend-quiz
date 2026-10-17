import type { BankDiff } from "./loadQuestions";

/** «новых 2, исправлено 1» — пустая строка, если ничего не поменялось. */
function formatParts(added: number, changed: number, removed: number, changedWord: string) {
  return [added && `новых ${added}`, changed && `${changedWord} ${changed}`, removed && `удалено ${removed}`].filter(Boolean).join(", ");
}

/**
 * «База обновлена: новых 2, исправлено 1.» или текст «уже свежая», если ничего не поменялось.
 * У набора с уроками — ещё «Уроки: новых 3.», даже если вопросы те же.
 */
export function formatDiff({ added, changed, removed, lessons }: BankDiff, updatedPrefix: string, freshText: string) {
  const questions = formatParts(added, changed, removed, "исправлено");
  const lessonParts = formatParts(lessons.added, lessons.changed, lessons.removed, "изменено");
  if (!questions && !lessonParts) return freshText;
  return `${updatedPrefix}${questions ? `: ${questions}` : ""}.${lessonParts ? ` Уроки: ${lessonParts}.` : ""}`;
}
