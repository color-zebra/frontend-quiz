import { lazy, useEffect, useRef, useState } from "react";
import type { BankDiff } from "../data/loadQuestions";
import { BUILTIN_SET_ID, type Question, type QuestionBank } from "../data/types";
import { useProgress } from "../features/progress/ProgressProvider";
import { dismissBankVersion, fetchBankVersion, getIsNewerBank } from "../features/bank/bankVersion";
import type { TrainingKind } from "../features/session/filters";
import { clearSavedSession, readSavedSession, restoreSession, saveSession } from "../features/session/savedSession";
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
import { TrainingSettingsScreen } from "../screens/training/TrainingSettingsScreen";
import { ThemeSheet } from "../theme/ThemeSheet";
import { applyTheme, readSavedTheme, type ThemeId } from "../theme/themes";
import { LazyScreen } from "./LazyScreen";
import { useScreenStack, type AppScreen } from "./useScreenStack";

// Режим обучения — отдельным файлом сборки: его код и разметка уроков грузятся, только когда открывают уроки.
const loadLessonScreens = () => import("../screens/lessons/lessonScreens");
const CourseScreen = lazy(() => loadLessonScreens().then((m) => ({ default: m.CourseScreen })));
const LessonScreen = lazy(() => loadLessonScreens().then((m) => ({ default: m.LessonScreen })));
const LessonQuizScreen = lazy(() => loadLessonScreens().then((m) => ({ default: m.LessonQuizScreen })));

/** Экран курса этого набора: оглавление, урок или вопросы урока. */
function isCourseScreen(screen: AppScreen, setId: string) {
  return (screen.name === "course" || screen.name === "lesson" || screen.name === "lessonQuiz") && screen.setId === setId;
}

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
  // Незаконченная сессия с прошлого запуска: на главной предлагаем продолжить.
  const [saved, setSaved] = useState(readSavedSession);
  // Дата сборки базы на сервере: если свежее нашей — на главной плашка «Вышла новая база».
  const [remoteVersion, setRemoteVersion] = useState<string | null>(null);

  useEffect(() => {
    fetchBankVersion().then(setRemoteVersion);
  }, []);

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
    // Каждое изменение сессии — на устройство: Android может выгрузить приложение посреди неё.
    if (next) saveSession({ setId: next.bank.setId, session: next.session, earnedBefore: [...next.earnedBefore] });
    else clearSavedSession();
  }

  /** Сессия с прошлого запуска, которую можно продолжить; null — нечего продолжать или набор ещё грузится. */
  function getResumable() {
    if (!saved || active) return null;
    const savedBank = getBank(saved.setId);
    const session = savedBank && restoreSession(savedBank, saved);
    return session ? { bank: savedBank, session, earnedBefore: new Set(saved.earnedBefore) } : null;
  }

  function resume(resumable: ActiveSession) {
    // Ответы прошлой сессии уже в ленте: отмечаем их как записанные, чтобы не записать второй раз.
    activeRef.current = resumable;
    updateActive(resumable);
    setSaved(null);
    nav.push({ name: "session" });
  }

  function discardSaved() {
    clearSavedSession();
    setSaved(null);
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
    setSaved(null);
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

  /**
   * Оглавление на место всех экранов курса, открытых поверх экрана набора: из урока или его вопросов «Назад»
   * потом ведёт к набору, а не обратно в пройденный урок. С экрана набора оглавление просто открывается.
   */
  function openCourse(setId: string, finished = false) {
    const stack = nav.getStack();
    let first = stack.length;
    while (first > 0 && isCourseScreen(stack[first - 1], setId)) first--;
    const course: AppScreen = { name: "course", setId, finished };
    if (first === stack.length) nav.push(course);
    else nav.rewind(stack.length - 1 - first, course);
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
    const resumable = screen.name === "home" ? getResumable() : null;
    switch (screen.name) {
      case "home":
        return (
          <HomeScreen
            bank={bank}
            onStart={(ids, length) => begin(bank, ids, length, "push")}
            onOpenSettings={() => nav.push({ name: "training", setId: BUILTIN_SET_ID, kind: "test" })}
            onOpenCabinet={() => nav.push({ name: "cabinet" })}
            onOpenSets={() => nav.push({ name: "sets" })}
            onOpenSpeech={() => nav.push({ name: "speechHome" })}
            onOpenHelp={() => nav.push({ name: "help" })}
            onUpdate={onUpdate}
            newBank={
              remoteVersion && getIsNewerBank(remoteVersion, bank.generatedAt)
                ? {
                    onDismiss: () => {
                      dismissBankVersion(remoteVersion);
                      setRemoteVersion(null);
                    },
                  }
                : null
            }
            resumable={
              resumable && { ...describeResumable(resumable), onResume: () => resume(resumable), onDiscard: discardSaved }
            }
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
            onUpdate={onUpdate}
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
            onOpenQuestion={(setId, questionId) => nav.push({ name: "review", setId, questionId })}
          />
        );
      case "speechHome":
        return (
          <SpeechHomeScreen
            bank={bank}
            onBack={nav.back}
            onStart={(ids, length) => begin(bank, ids, length, "push")}
            onOpenSettings={() => nav.push({ name: "training", setId: BUILTIN_SET_ID, kind: "speech" })}
          />
        );
      case "training": {
        const trainingBank = getBank(screen.setId);
        // Набор удалили, пока экран был в истории, — показывать нечего.
        if (!trainingBank) return null;
        return (
          <TrainingSettingsScreen
            bank={trainingBank}
            kind={screen.kind}
            subtitle={describeTraining(trainingBank, screen.kind)}
            onBack={nav.back}
            // Сессия встаёт на место экрана настройки: из итога «Назад» ведёт туда, откуда пришли, — на главную или к набору.
            onStart={(ids, length) => begin(trainingBank, ids, length, "replace")}
          />
        );
      }
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
            onOpenSettings={(kind) => nav.push({ name: "training", setId: screen.setId, kind })}
            onOpenCourse={() => openCourse(screen.setId)}
            onOpenLesson={(lessonId) => nav.push({ name: "lesson", setId: screen.setId, lessonId })}
            // Под вопросами — их урок: системная «Назад» из вопросов ведёт к тексту урока.
            onOpenLessonQuiz={(lessonId) => {
              nav.push({ name: "lesson", setId: screen.setId, lessonId });
              nav.push({ name: "lessonQuiz", setId: screen.setId, lessonId });
            }}
          />
        );
      case "course":
      case "lesson":
      case "lessonQuiz":
        return renderCourseScreen(screen);
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

  /** Экраны режима обучения. Ответы в них не проходят через updateActive — в ленту ничего не пишется. */
  function renderCourseScreen(screen: Extract<AppScreen, { name: "course" | "lesson" | "lessonQuiz" }>) {
    const courseBank = getBank(screen.setId);
    // Набор удалили, пока экран был в истории, — показывать нечего.
    if (!courseBank) return null;
    const { setId } = screen;
    return (
      <LazyScreen key={screen.name} onBack={nav.back}>
        {screen.name === "course" && (
          <CourseScreen
            bank={courseBank}
            finished={!!screen.finished}
            onBack={nav.back}
            onOpenLesson={(lessonId) => nav.push({ name: "lesson", setId, lessonId })}
          />
        )}
        {screen.name === "lesson" && (
          <LessonScreen
            bank={courseBank}
            lessonId={screen.lessonId}
            onBack={nav.back}
            onOpenCourse={() => openCourse(setId)}
            onOpenLesson={(lessonId) => nav.replace({ name: "lesson", setId, lessonId })}
            onOpenQuiz={() => nav.push({ name: "lessonQuiz", setId, lessonId: screen.lessonId })}
            onFinishCourse={() => openCourse(setId, true)}
          />
        )}
        {screen.name === "lessonQuiz" && (
          <LessonQuizScreen
            // Новый урок — новые вопросы с нуля, даже если экран тот же.
            key={screen.lessonId}
            bank={courseBank}
            lessonId={screen.lessonId}
            onBack={nav.back}
            onNextLesson={(lessonId) => nav.rewind(1, { name: "lesson", setId, lessonId })}
            onOpenCourse={() => openCourse(setId)}
            onFinishCourse={() => openCourse(setId, true)}
          />
        )}
      </LazyScreen>
    );
  }
}

/** Подзаголовок экрана настройки: откуда вопросы. */
function describeTraining(bank: QuestionBank, kind: TrainingKind) {
  if (bank.setId !== BUILTIN_SET_ID) return `Набор «${bank.title ?? ""}»`;
  return kind === "speech" ? "Устные вопросы" : "Тестовые вопросы";
}

/** Подпись плашки «Незаконченная сессия»: где остановился и откуда вопросы. */
function describeResumable({ bank, session }: { bank: QuestionBank; session: Session }) {
  const position = session.infinite
    ? `вопрос ${session.index + 1}`
    : `вопрос ${session.index + 1} из ${session.queue.length}`;
  const speech = bank.byId.get(session.queue[session.index])?.type === "speech";
  const source = bank.setId === BUILTIN_SET_ID ? (speech ? "устные вопросы" : "") : `набор «${bank.title ?? ""}»`;
  return { text: [position, source].filter(Boolean).join(" · ") };
}
