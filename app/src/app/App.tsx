import { useEffect, useState } from "react";
import { loadInitialBank, updateBank } from "../data/loadQuestions";
import type { QuestionBank } from "../data/types";
import { NotesProvider } from "../features/notes/NotesProvider";
import { AppUpdateToast } from "../features/pwa/AppUpdateToast";
import { Background } from "../shared/ui/Background";
import { Brand } from "../shared/ui/Brand";
import { Button } from "../shared/ui/Button";
import styles from "./App.module.css";
import { QuizApp } from "./QuizApp";

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; bank: QuestionBank };

export function App() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  function load() {
    setState({ status: "loading" });
    loadInitialBank().then(
      (bank) => setState({ status: "ready", bank }),
      (error: unknown) =>
        setState({ status: "error", message: error instanceof Error ? error.message : "Неизвестная ошибка" }),
    );
  }

  useEffect(load, []);

  /** Кнопка «Обновить»: свежая база заменяет текущую, наружу уходит сводка изменений. */
  async function update(current: QuestionBank) {
    const { bank, diff } = await updateBank(current);
    setState({ status: "ready", bank });
    return diff;
  }

  return (
    <>
      <Background />
      <AppUpdateToast />
      {state.status === "ready" && (
        <NotesProvider bank={state.bank}>
          <QuizApp bank={state.bank} onUpdate={() => update(state.bank)} />
        </NotesProvider>
      )}
      {state.status === "loading" && (
        <div className={styles.status}>
          <Brand />
          <p className={styles.loading}>Загружаем вопросы…</p>
        </div>
      )}
      {state.status === "error" && (
        <div className={styles.status} role="alert">
          <Brand />
          <p>Не удалось загрузить вопросы.</p>
          <p className={styles.details}>{state.message}</p>
          <Button icon="refresh" onClick={load}>
            Попробовать ещё раз
          </Button>
        </div>
      )}
    </>
  );
}
