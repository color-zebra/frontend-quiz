import { useEffect, useRef, useState } from "react";
import type { Question, QuestionBank } from "../data/types";
import { getPool, loadFilters, saveFilters, type Filters } from "../features/session/filters";
import {
  getIsLastQuestion,
  goToNextQuestion,
  pickOption,
  startSession,
  type Session,
  type SessionAnswer,
} from "../features/session/session";
import { HomeScreen } from "../screens/home/HomeScreen";
import { NotesScreen } from "../screens/notes/NotesScreen";
import { ReviewScreen } from "../screens/review/ReviewScreen";
import { SessionScreen } from "../screens/session/SessionScreen";
import { SummaryScreen } from "../screens/summary/SummaryScreen";
import { ThemeSheet } from "../theme/ThemeSheet";
import { applyTheme, readSavedTheme, type ThemeId } from "../theme/themes";
import { useScreenStack, type AppScreen } from "./useScreenStack";

export function QuizApp({ bank }: { bank: QuestionBank }) {
  const [filters, setFilters] = useState(() => loadFilters(bank));
  const [session, setSession] = useState<Session | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const [finishedAnswers, setFinishedAnswers] = useState<SessionAnswer[]>([]);
  const [theme, setTheme] = useState<ThemeId>(readSavedTheme);
  const [themeOpen, setThemeOpen] = useState(false);

  const nav = useScreenStack({ name: "home" }, handlePop);

  // Новый экран всегда открывается с начала.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [nav.screen]);

  function updateSession(next: Session | null) {
    sessionRef.current = next;
    setSession(next);
  }

  /** Системная кнопка «Назад» посреди сессии с ответами — показываем итог, а не теряем его. */
  function handlePop(popped: AppScreen[]) {
    if (!popped.some((s) => s.name === "session")) return;
    const answers = sessionRef.current?.answers ?? [];
    updateSession(null);
    if (answers.length > 0) {
      setFinishedAnswers(answers);
      nav.push({ name: "summary" });
    }
  }

  function changeFilters(next: Filters) {
    setFilters(next);
    saveFilters(next);
  }

  function begin(ids: string[], length: number | "infinite", mode: "push" | "replace") {
    updateSession(startSession(bank, ids, length));
    if (mode === "push") nav.push({ name: "session" });
    else nav.replace({ name: "session" });
  }

  function finish(current: Session) {
    setFinishedAnswers(current.answers);
    updateSession(null);
    nav.replace({ name: "summary" });
  }

  function pick(question: Question, optionIndex: number) {
    if (session) updateSession(pickOption(session, question, optionIndex));
  }

  function next() {
    if (!session || session.picked === null) return;
    if (getIsLastQuestion(session)) {
      finish(session);
      return;
    }
    updateSession(goToNextQuestion(bank, session));
    window.scrollTo(0, 0);
  }

  function exit() {
    if (session && session.answers.length > 0) {
      finish(session);
      return;
    }
    updateSession(null);
    nav.back();
  }

  function selectTheme(id: ThemeId) {
    applyTheme(id);
    setTheme(id);
  }

  return (
    <>
      {renderScreen()}
      <ThemeSheet open={themeOpen} current={theme} onSelect={selectTheme} onClose={() => setThemeOpen(false)} />
    </>
  );

  // Обычная функция, а не компонент: компонент, объявленный внутри, пересоздавался бы на каждой отрисовке.
  function renderScreen() {
    const screen = nav.screen;
    switch (screen.name) {
      case "home":
        return (
          <HomeScreen
            bank={bank}
            filters={filters}
            onFiltersChange={changeFilters}
            onStart={() =>
              begin(
                getPool(bank, filters).map((q) => q.id),
                filters.length,
                "push",
              )
            }
            onOpenNotes={() => nav.push({ name: "notes" })}
            theme={theme}
            onOpenTheme={() => setThemeOpen(true)}
          />
        );
      case "session":
        return session ? <SessionScreen bank={bank} session={session} onPick={pick} onNext={next} onExit={exit} /> : null;
      case "summary":
        return (
          <SummaryScreen
            bank={bank}
            answers={finishedAnswers}
            onRetryMistakes={(ids) => begin(ids, ids.length, "replace")}
            onOpenQuestion={(questionId) => nav.push({ name: "review", questionId })}
            onHome={nav.backToRoot}
          />
        );
      case "notes":
        return (
          <NotesScreen
            bank={bank}
            onBack={nav.back}
            onOpenQuestion={(questionId) => nav.push({ name: "review", questionId })}
          />
        );
      case "review":
        return <ReviewScreen bank={bank} questionId={screen.questionId} onBack={nav.back} />;
    }
  }
}
