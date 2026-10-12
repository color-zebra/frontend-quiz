import type { BankDiff } from "./loadQuestions";

/** «База обновлена: новых 2, исправлено 1.» или текст «уже свежая», если ничего не поменялось. */
export function formatDiff({ added, changed, removed }: BankDiff, updatedPrefix: string, freshText: string) {
  const parts = [added && `новых ${added}`, changed && `исправлено ${changed}`, removed && `удалено ${removed}`].filter(Boolean);
  return parts.length ? `${updatedPrefix}: ${parts.join(", ")}.` : freshText;
}
