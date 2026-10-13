import { useState } from "react";
import { formatDiff } from "../../data/formatDiff";
import type { BankDiff } from "../../data/loadQuestions";
import { BUILTIN_SET_ID } from "../../data/types";
import { useProgress } from "../progress/ProgressProvider";

export type UpdateState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; text: string }
  | { kind: "error"; text: string };

/**
 * Обновление основной базы: скачать, показать сводку изменений, вывести исправленные вопросы из ошибок.
 * Им пользуются кабинет (кнопка «Обновить») и главная (плашка «Вышла новая база»).
 */
export function useBankUpdate(onUpdate: () => Promise<BankDiff>) {
  const { resetQuestions } = useProgress();
  const [state, setState] = useState<UpdateState>({ kind: "idle" });

  function run() {
    setState({ kind: "loading" });
    onUpdate().then(
      (diff) => {
        resetQuestions(BUILTIN_SET_ID, diff.changedIds);
        setState({ kind: "done", text: formatDiff(diff, "База обновлена", "У тебя самая свежая база.") });
      },
      (error: unknown) =>
        setState({
          kind: "error",
          text: `Не удалось обновить: ${error instanceof Error ? error.message : "неизвестная ошибка"}`,
        }),
    );
  }

  return { state, run, reset: () => setState({ kind: "idle" }) };
}
