import { useEffect, useRef, useState } from "react";
import type { BankDiff } from "../data/loadQuestions";
import { BUILTIN_SET_ID, type Question, type QuestionBank } from "../data/types";
import { useProgress } from "../features/progress/ProgressProvider";
import { useSets } from "../features/sets/SetsProvider";
import {
  getIsLastQuestion,
  giveUp,
  gradeSpeech,
  goToNextQuestion,
  selectOption,
  startSession,
  submitAnswer,
  type Session,
  type SessionAnswer,
  type SpeechGrade,
} from "../features/session/session";
import { getAchievements } from "../features/achievements/compute";
import { AchievementsScreen } from "../screens/achievements/AchievementsScreen";
import { CabinetScreen } from "../screens/cabinet/CabinetScreen";
import { HelpHubScreen } from "../screens/help/HelpHubScreen";
import { HelpScreen } from "../screens/help/HelpScreen";
import { SetsHelpScreen } from "../screens/help/SetsHelpScreen";
import { HomeScreen } from "../screens/home/HomeScreen";
import { NotesScreen } from "../screens/notes/NotesScreen";
import { ReviewScreen } from "../screens/review/ReviewScreen";
import { SessionScreen } from "../screens/session/SessionScreen";
import { SetHomeScreen } from "../screens/sets/SetHomeScreen";
import { SetsScreen } from "../screens/sets/SetsScreen";
import { SpeechHomeScreen } from "../screens/speech/SpeechHomeScreen";
import { StatsScreen } from "../screens/stats/StatsScreen";
import { SummaryScreen } from "../screens/summary/SummaryScreen";
import { ThemeSheet } from "../theme/ThemeSheet";
import { applyTheme, readSavedTheme, type ThemeId } from "../theme/themes";
import { useScreenStack, type AppScreen } from "./useScreenStack";

/** Прямые ссылки на помощь: …/#help, …/#help-basics и …/#help-sets открывают её поверх главной. */
function getInitialStack(): AppScreen[] {
  if (location.hash === "#help") return [{ name: "home" }, { name: "help" }];
  if (location.hash === "#help-basics") return [{ name: "home" }, { name: "helpBasics" }];
  if (location.hash === "#help-sets") return [{ name: "home" }, { name: "helpSets" }];
  return [{ name: "home" }];
}

interface QuizAppProps {
  bank: QuestionBank;
  onUpdate: () => Promise<BankDiff>;
}

/** Сессия вместе с базой, из которой её запустили: основной или своего набора. */
interface ActiveSession {
  bank: QuestionBank;
  session: Session;
  /** Ачивки, полученные до начала сессии: в итоге покажем те, что добавились. */
  earnedBefore: ReadonlySet<string>;
}

interface FinishedSession {
  bank: QuestionBank;
  answers: SessionAnswer[];
  earnedBefore: ReadonlySet<string>;
}

export function QuizApp({ bank, onUpdate }: QuizAppProps) {
  const { getSetBank } = useSets();
  const { recordAnswer, records } = useProgress();
  const [active, setActive] = useState<ActiveSession | null>(null);
  const activeRef = useRef<ActiveSession | null>(null);
  const [finished, setFinished] = useState<FinishedSession | null>(null);
  const [theme, setTheme] = useState<ThemeId>(readSavedTheme);
  const [themeOpen, setThemeOpen] = useState(false);

  const nav = useScreenStack(getInitialStack(), handlePop);

  // Новый экран всегда открывается с начала.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [nav.screen]);

  function getBank(setId: string) {
    return setId === BUILTIN_SET_ID ? bank : getSetBank(setId);
  }

  /** Каждый новый ответ — сразу в ленту: не теряется, даже если сессию бросили посреди. */
  function recordNewAnswers(next: ActiveSession) {
    const before = activeRef.current?.session.answers.length ?? 0;
    for (const answer of next.session.answers.slice(before)) recordAnswer(next.bank.setId, answer);
  }

  function updateActive(next: ActiveSession | null) {
    if (next) recordNewAnswers(next);
    activeRef.current = next;
    setActive(next);
  }

  /** Системная кнопка «Назад» посреди сессии с ответами — показываем итог, а не теряем его. */
  function handlePop(popped: AppScreen[]) {
    if (!popped.some((s) => s.name === "session")) return;
    const current = activeRef.current;
    updateActive(null);
    if (current && current.session.answers.length > 0) {
      setFinished({ bank: current.bank, answers: current.session.answers, earnedBefore: current.earnedBefore });
      nav.push({ name: "summary" });
    }
  }

  function getEarnedIds() {
    return new Set(
      getAchievements(bank, records)
        .filter((s) => s.earnedAt)
        .map((s) => s.achievement.id),
    );
  }

  function begin(sessionBank: QuestionBank, ids: string[], length: number | "infinite", mode: "push" | "replace") {
    updateActive({ bank: sessionBank, session: startSession(sessionBank, ids, length), earnedBefore: getEarnedIds() });
    if (mode === "push") nav.push({ name: "session" });
    else nav.replace({ name: "session" });
  }

  function finish(current: ActiveSession) {
    // Последний ответ устной сессии сразу ведёт сюда, минуя updateActive.
    recordNewAnswers(current);
    setFinished({ bank: current.bank, answers: current.session.answers, earnedBefore: current.earnedBefore });
    updateActive(null);
    nav.replace({ name: "summary" });
  }

  function select(question: Question, optionIndex: number) {
    if (active) updateActive({ ...active, session: selectOption(active.session, question, optionIndex) });
  }

/** Самооценка устного ответа — сразу переход к следующему вопросу или к итогу. */
  function grade(question: Question, value: SpeechGrade) {
    if (!active) return;
    const graded = { ...active, session: gradeSpeech(active.session, question, value) };
    if (getIsLastQuestion(graded.session)) {
      finish(graded);
      return;
    }
    updateActive({ ...graded, session: goToNextQuestion(graded.bank, graded.session) });
    window.scrollTo(0, 0);
  }

  function surrender(question: Question) {
    if (active) updateActive({ ...active, session: giveUp(active.session, question) });
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
            onOpenCabinet={() => nav.push({ name: "cabinet" })}
            onOpenSets={() => nav.push({ name: "sets" })}
            onOpenSpeech={() => nav.push({ name: "speechHome" })}
            onOpenHelp={() => nav.push({ name: "help" })}
            onUpdate={onUpdate}
          />
        );
      case "cabinet":
        return (
          <CabinetScreen
            bank={bank}
            theme={theme}
            onBack={nav.back}
            onOpenStats={() => nav.push({ name: "stats" })}
            onOpenAchievements={() => nav.push({ name: "achievements" })}
            onOpenNotes={() => nav.push({ name: "notes" })}
            onOpenTheme={() => setThemeOpen(true)}
          />
        );
      case "achievements":
        return <AchievementsScreen bank={bank} onBack={nav.back} />;
      case "stats":
        return (
          <StatsScreen
            bank={bank}
            onBack={nav.back}
            onStart={(from, ids, length) => begin(from, ids, length, "push")}
          />
        );
      case "speechHome":
        return <SpeechHomeScreen bank={bank} onBack={nav.back} onStart={(ids, length) => begin(bank, ids, length, "push")} />;
      case "sets":
        return (
          <SetsScreen
            onBack={nav.back}
            onOpenSet={(setId) => nav.push({ name: "setHome", setId })}
            onOpenHelp={() => nav.push({ name: "helpSets" })}
          />
        );
      case "setHome":
        return (
          <SetHomeScreen
            setId={screen.setId}
            onBack={nav.back}
            onStart={(setBank, ids, length) => begin(setBank, ids, length, "push")}
          />
        );
      case "help":
        return (
          <HelpHubScreen
            onBack={nav.back}
            onOpenBasics={() => nav.push({ name: "helpBasics" })}
            onOpenSetsHelp={() => nav.push({ name: "helpSets" })}
          />
        );
      case "helpBasics":
        return <HelpScreen onBack={nav.back} onOpenSetsHelp={() => nav.push({ name: "helpSets" })} />;
      case "helpSets":
        return <SetsHelpScreen onBack={nav.back} onOpenSets={() => nav.push({ name: "sets" })} />;
      case "session":
        return active ? (
          <SessionScreen
            bank={active.bank}
            session={active.session}
            onSelect={select}
            onSubmit={submit}
            onGiveUp={surrender}
            onGrade={grade}
            onNext={next}
            onExit={exit}
          />
        ) : null;
      case "summary":
        return finished ? (
          <SummaryScreen
            bank={finished.bank}
            answers={finished.answers}
            achievements={getAchievements(bank, records)
              .filter((s) => s.earnedAt && !finished.earnedBefore.has(s.achievement.id))
              .map((s) => s.achievement)}
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
