import { useEffect, useRef, useState } from "react";
import type { BankDiff } from "../data/loadQuestions";
import { BUILTIN_SET_ID, type Question, type QuestionBank } from "../data/types";
import { useSets } from "../features/sets/SetsProvider";
import {
  getIsLastQuestion,
  goToNextQuestion,
  selectOption,
  startSession,
  submitAnswer,
  type Session,
  type SessionAnswer,
} from "../features/session/session";
import { HomeScreen } from "../screens/home/HomeScreen";
import { NotesScreen } from "../screens/notes/NotesScreen";
import { ReviewScreen } from "../screens/review/ReviewScreen";
import { SessionScreen } from "../screens/session/SessionScreen";
import { SetHomeScreen } from "../screens/sets/SetHomeScreen";
import { SetsScreen } from "../screens/sets/SetsScreen";
import { SummaryScreen } from "../screens/summary/SummaryScreen";
import { ThemeSheet } from "../theme/ThemeSheet";
import { applyTheme, readSavedTheme, type ThemeId } from "../theme/themes";
import { useScreenStack, type AppScreen } from "./useScreenStack";

interface QuizAppProps {
  bank: QuestionBank;
  onUpdate: () => Promise<BankDiff>;
}

/** Сессия вместе с базой, из которой её запустили: основной или своего набора. */
interface ActiveSession {
  bank: QuestionBank;
  session: Session;
}

interface FinishedSession {
  bank: QuestionBank;
  answers: SessionAnswer[];
}

export function QuizApp({ bank, onUpdate }: QuizAppProps) {
  const { getSetBank } = useSets();
  const [active, setActive] = useState<ActiveSession | null>(null);
  const activeRef = useRef<ActiveSession | null>(null);
  const [finished, setFinished] = useState<FinishedSession | null>(null);
  const [theme, setTheme] = useState<ThemeId>(readSavedTheme);
  const [themeOpen, setThemeOpen] = useState(false);

  const nav = useScreenStack({ name: "home" }, handlePop);

  // Новый экран всегда открывается с начала.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [nav.screen]);

  function getBank(setId: string) {
    return setId === BUILTIN_SET_ID ? bank : getSetBank(setId);
  }

  function updateActive(next: ActiveSession | null) {
    activeRef.current = next;
    setActive(next);
  }

  /** Системная кнопка «Назад» посреди сессии с ответами — показываем итог, а не теряем его. */
  function handlePop(popped: AppScreen[]) {
    if (!popped.some((s) => s.name === "session")) return;
    const current = activeRef.current;
    updateActive(null);
    if (current && current.session.answers.length > 0) {
      setFinished({ bank: current.bank, answers: current.session.answers });
      nav.push({ name: "summary" });
    }
  }

  function begin(sessionBank: QuestionBank, ids: string[], length: number | "infinite", mode: "push" | "replace") {
    updateActive({ bank: sessionBank, session: startSession(sessionBank, ids, length) });
    if (mode === "push") nav.push({ name: "session" });
    else nav.replace({ name: "session" });
  }

  function finish(current: ActiveSession) {
    setFinished({ bank: current.bank, answers: current.session.answers });
    updateActive(null);
    nav.replace({ name: "summary" });
  }

  function select(question: Question, optionIndex: number) {
    if (active) updateActive({ ...active, session: selectOption(active.session, question, optionIndex) });
  }

  function submit(question: Question) {
    if (active) updateActive({ ...active, session: submitAnswer(active.session, question) });
  }

  function next() {
    if (!active || !active.session.answered) return;
    if (getIsLastQuestion(active.session)) {
      finish(active);
      return;
    }
    updateActive({ ...active, session: goToNextQuestion(active.bank, active.session) });
    window.scrollTo(0, 0);
  }

  function exit() {
    if (active && active.session.answers.length > 0) {
      finish(active);
      return;
    }
    updateActive(null);
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
            onStart={(ids, length) => begin(bank, ids, length, "push")}
            onOpenNotes={() => nav.push({ name: "notes" })}
            onOpenSets={() => nav.push({ name: "sets" })}
            onUpdate={onUpdate}
            theme={theme}
            onOpenTheme={() => setThemeOpen(true)}
          />
        );
      case "sets":
        return <SetsScreen onBack={nav.back} onOpenSet={(setId) => nav.push({ name: "setHome", setId })} />;
      case "setHome":
        return (
          <SetHomeScreen
            setId={screen.setId}
            onBack={nav.back}
            onStart={(setBank, ids, length) => begin(setBank, ids, length, "push")}
          />
        );
      case "session":
        return active ? (
          <SessionScreen
            bank={active.bank}
            session={active.session}
            onSelect={select}
            onSubmit={submit}
            onNext={next}
            onExit={exit}
          />
        ) : null;
      case "summary":
        return finished ? (
          <SummaryScreen
            bank={finished.bank}
            answers={finished.answers}
            backLabel={finished.bank.setId === BUILTIN_SET_ID ? "На главную" : "К набору"}
            onRetryMistakes={(ids) => begin(finished.bank, ids, ids.length, "replace")}
            onOpenQuestion={(questionId) => nav.push({ name: "review", setId: finished.bank.setId, questionId })}
            onBack={nav.back}
          />
        ) : null;
      case "notes":
        return (
          <NotesScreen
            getBank={getBank}
            onBack={nav.back}
            onOpenQuestion={(setId, questionId) => nav.push({ name: "review", setId, questionId })}
          />
        );
      case "review":
        return <ReviewScreen bank={getBank(screen.setId)} questionId={screen.questionId} onBack={nav.back} />;
    }
  }
}
