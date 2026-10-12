import { useEffect, useState } from "react";
import { loadQuestions } from "../data/loadQuestions";
import type { QuestionBank } from "../data/types";
import { NotesProvider } from "../features/notes/NotesProvider";
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
    loadQuestions().then(
      (bank) => setState({ status: "ready", bank }),
      (error: unknown) =>
        setState({ status: "error", message: error instanceof Error ? error.message : "Неизвестная ошибка" }),
    );
  }

  useEffect(load, []);

  return (
    <>
      <Background />
      {state.status === "ready" && (
        <NotesProvider bank={state.bank}>
          <QuizApp bank={state.bank} />
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
