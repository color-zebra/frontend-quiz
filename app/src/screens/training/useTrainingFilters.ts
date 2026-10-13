import { useState } from "react";
import type { QuestionBank } from "../../data/types";
import { useProgress } from "../../features/progress/ProgressProvider";
import {
  getIsInMode,
  getPool,
  getSource,
  loadFilters,
  saveFilters,
  type Filters,
  type QuestionMode,
  type TrainingKind,
} from "../../features/session/filters";

/**
 * Сохранённый выбор раздела и что из него следует: сколько вопросов новых и с ошибками, что попадёт в сессию.
 * Главная и экран настройки читают выбор каждый сам: открыт всегда только один из них.
 */
export function useTrainingFilters(bank: QuestionBank, kind: TrainingKind) {
  const [filters, setFilters] = useState(() => loadFilters(bank, kind));
  const { getProgress } = useProgress();
  // Галка имеет смысл только в тестовом разделе и только если устные вопросы вообще есть.
  const canMixSpeech = kind === "test" && bank.speech.length > 0;
  const effective = canMixSpeech ? filters : { ...filters, withSpeech: false };
  const all = getSource(bank, kind, effective);
  const isIn = (mode: QuestionMode) => all.filter((q) => getIsInMode(mode, getProgress(bank.setId, q.id)));
  const counts = { all: all.length, new: isIn("new").length, mistakes: isIn("mistakes").length };
  // Запомнено «Ошибки», а ошибок не осталось, — показываем все, а не пустой список.
  const mode = filters.mode !== "all" && counts[filters.mode] === 0 ? "all" : filters.mode;
  const source = mode === "all" ? all : isIn(mode);
  const pool = getPool(source, effective);

  function update(patch: Partial<Filters>) {
    const next = { ...filters, ...patch };
    setFilters(next);
    saveFilters(bank, kind, next);
  }

  return { filters, update, canMixSpeech, counts, mode, source, pool };
}

export type TrainingFiltersState = ReturnType<typeof useTrainingFilters>;
