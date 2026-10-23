import { lazy, useEffect, useRef, useState } from "react";
import type { BankDiff } from "../data/loadQuestions";
import { BUILTIN_SET_ID, type Question, type QuestionBank } from "../data/types";
import { AudioPlayer, type PlayingLesson } from "../features/audio/AudioPlayer";
import { useAudio, type AudioTrack } from "../features/audio/AudioProvider";
import { getLessonQuestionIds, getStartLesson } from "../features/lessons/course";
import { useLessons } from "../features/lessons/LessonsProvider";
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
import { useCatalogAdd } from "../features/courses/useCatalogAdd";
import { getEntryProgress, getEntrySetId } from "../features/courses/courses";
import { CATALOG, findAddedSet, type CatalogEntry } from "../features/sets/catalog";
import { readSection, writeSection, type Section } from "../shared/ui/SectionSwitch";
import { useIsDesktop } from "../shared/ui/useIsDesktop";
import { DesktopShell, type ShellMode } from "./DesktopShell";
import { PageScrollbar } from "../shared/ui/PageScrollbar";
import { AllCoursesScreen } from "../screens/courses/AllCoursesScreen";
import { CoursePreviewScreen } from "../screens/courses/CoursePreviewScreen";
import { CoursesScreen } from "../screens/courses/CoursesScreen";

// Режим обучения — отдельным файлом сборки: его код и разметка уроков грузятся, только когда открывают уроки.
const loadLessonScreens = () => import("../screens/lessons/lessonScreens");
const CourseScreen = lazy(() => loadLessonScreens().then((m) => ({ default: m.CourseScreen })));
const LessonScreen = lazy(() => loadLessonScreens().then((m) => ({ default: m.LessonScreen })));
const LessonQuizScreen = lazy(() => loadLessonScreens().then((m) => ({ default: m.LessonQuizScreen })));

/** Экран курса этого набора: оглавление, урок или вопросы урока. */
function isCourseScreen(screen: AppScreen, setId: string) {
  return (screen.name === "course" || screen.name === "lesson" || screen.name === "lessonQuiz") && screen.setId === setId;
}

/** Раскладка десктопа: урок — с полосой значков вместо меню, тест — без меню, остальное — с боковым меню. */
function getShellMode(screen: AppScreen): ShellMode {
  if (screen.name === "lesson") return "rail";
  if (screen.name === "session" || screen.name === "lessonQuiz") return "focus";
  return "side";
}

/** Раздел, который подсвечен в меню: экраны курсов — «Курсы», остальное — раздел, из которого пришли. */
function getScreenSection(stack: AppScreen[]): Section | null {
  const screen = stack[stack.length - 1];
  if (screen.name.startsWith("help")) return null;
  if (["courses", "allCourses", "coursePreview", "course", "lesson", "lessonQuiz"].includes(screen.name)) return "courses";
  const root = stack[0].name;
  return root === "courses" ? "courses" : root === "cabinet" ? "cabinet" : "trainer";
}

/** Корневой экран раздела. */
function getSectionRoot(section: Section): AppScreen {
  if (section === "courses") return { name: "courses" };
  if (section === "cabinet") return { name: "cabinet" };
  return { name: "home" };
}

/**
 * Открываемся в разделе, где были в прошлый раз (первый запуск — «Курсы»). Прямые ссылки на помощь: …/#help,
 * …/#help-basics и …/#help-sets открывают её поверх раздела.
 */
function getInitialStack(): AppScreen[] {
  const root = getSectionRoot(readSection());
  if (location.hash === "#help") return [root, { name: "help" }];
  if (location.hash === "#help-basics") return [root, { name: "helpBasics" }];
  if (location.hash === "#help-sets") return [root, { name: "helpSets" }];
  return [root];
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
  const { sets, getSetBank } = useSets();
  const audio = useAudio();
  const { getCourse, updateCourse } = useLessons();
  const catalogAdd = useCatalogAdd();
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
  const desktop = useIsDesktop();

  // Набор или урок, который играет, удалили — плеер закрывается: играть больше нечего.
  const playingTrack = audio.track;
  const playingBank = playingTrack ? getSetBank(playingTrack.setId) : undefined;
  const trackGone = !!playingTrack && !playingBank?.lessons?.some((l) => l.id === playingTrack.lessonId && l.audio);
  useEffect(() => {
    if (trackGone) audio.close();
  }, [trackGone]);

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

  /**
   * Переключатель разделов (на десктопе — боковое меню, оно видно и в глубине раздела): стек откатывается к корню,
   * корень подменяется, раздел запоминается до следующего запуска.
   */
  function selectSection(section: Section) {
    writeSection(section);
    nav.rewind(nav.getStack().length - 1, getSectionRoot(section));
  }

  /** Курс из каталога: добавлен — его страница, нет — страница до скачивания. */
  function openCatalogCourse(entry: CatalogEntry) {
    const record = findAddedSet(entry, sets);
    nav.push(record ? { name: "course", setId: record.id } : { name: "coursePreview", url: entry.url });
  }

  /**
   * «Начать курс»: скачать, встать на место страницы до скачивания страницей курса и открыть урок — первый или тот,
   * на котором остановился, если курс уже проходили и удаляли с телефона: прогресс живёт отдельно от файлов.
   */
  async function startCatalogCourse(entry: CatalogEntry) {
    const record = await catalogAdd.add(entry);
    const lessons = record?.file.lessons ?? [];
    if (!record || lessons.length === 0) return;
    const progress = getCourse(record.id);
    const lesson = lessons.find((l) => l.id === progress?.position?.lessonId) ?? getStartLesson(lessons, progress);
    nav.replace({ name: "course", setId: record.id });
    nav.push({ name: "lesson", setId: record.id, lessonId: lesson.id });
  }

  /** Вопросы урока поверх самого урока: системная «Назад» из вопросов ведёт к тексту урока. */
  function openLessonQuiz(setId: string, lessonId: string) {
    nav.push({ name: "lesson", setId, lessonId });
    nav.push({ name: "lessonQuiz", setId, lessonId });
  }

  /** Нажатие на «Урок N · курс» в плеере: открыть урок, который играет, если он уже не на экране. */
  function openPlayingLesson(setId: string, lessonId: string) {
    if (isLessonOnScreen(setId, lessonId)) return;
    nav.push({ name: "lesson", setId, lessonId });
  }

  function isLessonOnScreen(setId: string, lessonId: string) {
    const screen = nav.screen;
    return screen.name === "lesson" && screen.setId === setId && screen.lessonId === lessonId;
  }

  /** Что плеер покажет об играющем уроке: номер, следующий урок с озвучкой, есть ли вопросы. */
  function describePlayingLesson(track: AudioTrack | null): PlayingLesson | null {
    if (!track) return null;
    const courseBank = getBank(track.setId);
    const lessons = courseBank?.lessons ?? [];
    const index = lessons.findIndex((l) => l.id === track.lessonId);
    if (!courseBank || index < 0) return null;
    const next = lessons[index + 1];
    return {
      number: index + 1,
      hasQuestions: getLessonQuestionIds(courseBank, lessons[index]).length > 0,
      onLessonPage: isLessonOnScreen(track.setId, track.lessonId),
      next: next?.audio
        ? { setId: track.setId, lessonId: next.id, src: next.audio, title: next.title, course: courseBank.title ?? "" }
        : null,
    };
  }

  /** «К вопросам урока» в дослушанном плеере — как одноимённая кнопка в конце урока: начатые продолжаются. */
  function openPlayingQuestions(setId: string, lessonId: string) {
    const courseBank = getBank(setId);
    const lesson = courseBank?.lessons?.find((l) => l.id === lessonId);
    if (!courseBank || !lesson) return;
    const count = getLessonQuestionIds(courseBank, lesson).length;
    const position = getCourse(setId)?.position;
    const resume = position?.lessonId === lessonId && position.step === "quiz" && position.index > 0 && position.index < count;
    if (!resume) updateCourse(setId, { position: { lessonId, step: "quiz", index: 0, correct: 0 } });
    nav.push({ name: "lessonQuiz", setId, lessonId });
  }

  /** «Урок N+1» в дослушанном плеере: следующий урок играет, а открытая страница урока сменяется на него. */
  function playNextLesson(track: AudioTrack) {
    const current = audio.track;
    if (current && isLessonOnScreen(current.setId, current.lessonId)) {
      nav.replace({ name: "lesson", setId: track.setId, lessonId: track.lessonId });
    }
    audio.play(track);
  }

  function selectTheme(id: ThemeId) {
    applyTheme(id);
    setTheme(id);
  }

  const screen = nav.screen;
  return (
    <>
      {desktop ? (
        <DesktopShell
          mode={getShellMode(screen)}
          bank={bank}
          onOpenStats={() => screen.name !== "stats" && nav.push({ name: "stats" })}
          section={getScreenSection(nav.getStack())}
          courseId={"setId" in screen && ["course", "lesson", "lessonQuiz"].includes(screen.name) ? screen.setId : undefined}
          onSelectSection={selectSection}
          onOpenCourse={(setId) => {
            if (!(screen.name === "course" && screen.setId === setId)) nav.push({ name: "course", setId });
          }}
          onOpenHelp={() => screen.name !== "help" && nav.push({ name: "help" })}
          onOpenLesson={openPlayingLesson}
        >
          {renderScreen()}
        </DesktopShell>
      ) : (
        renderScreen()
      )}
      <AudioPlayer
        lesson={describePlayingLesson(audio.track)}
        onOpenLesson={openPlayingLesson}
        onOpenQuestions={openPlayingQuestions}
        onPlayNext={playNextLesson}
      />
      {desktop && <PageScrollbar />}
      <ThemeSheet open={themeOpen} current={theme} onSelect={selectTheme} onClose={() => setThemeOpen(false)} />
    </>
  );

  // Обычная функция, а не компонент: компонент, объявленный внутри, пересоздавался бы на каждой отрисовке.
  function renderScreen() {
    const screen = nav.screen;
    const resumable = screen.name === "home" ? getResumable() : null;
    switch (screen.name) {
      case "courses":
        return (
          <CoursesScreen
            bank={bank}
            onRetryMistakes={(ids) => begin(bank, ids, ids.length, "push")}
            onSelectSection={selectSection}
            onOpenHelp={() => nav.push({ name: "help" })}
            onOpenCourse={(setId) => nav.push({ name: "course", setId })}
            onOpenPreview={(url) => nav.push({ name: "coursePreview", url })}
            onOpenAll={() => nav.push({ name: "allCourses" })}
            onOpenLesson={(setId, lessonId) => nav.push({ name: "lesson", setId, lessonId })}
            onOpenLessonQuiz={openLessonQuiz}
          />
        );
      case "allCourses":
        return (
          <AllCoursesScreen
            onBack={nav.back}
            onOpenCourse={openCatalogCourse}
            onOpenSets={() => nav.push({ name: "sets" })}
            onOpenOwnCourse={(setId) => nav.push({ name: "course", setId })}
          />
        );
      case "coursePreview": {
        const entry = CATALOG.find((e) => e.url === screen.url);
        if (!entry) return null;
        // Курс уже скачан (например, добавлен в «Своих наборах») — сразу его страница.
        const added = findAddedSet(entry, sets);
        if (added) return renderCourseScreen({ name: "course", setId: added.id });
        return (
          <CoursePreviewScreen
            entry={entry}
            progress={getEntryProgress(entry, getCourse(getEntrySetId(entry) ?? ""))}
            onBack={nav.back}
            onStart={() => void startCatalogCourse(entry)}
            busy={catalogAdd.busyUrl === entry.url}
            message={catalogAdd.message?.url === entry.url ? catalogAdd.message : null}
            onCloseMessage={catalogAdd.clearMessage}
          />
        );
      }
      case "home":
        return (
          <HomeScreen
            onSelectSection={selectSection}
            bank={bank}
            onStart={(ids, length) => begin(bank, ids, length, "push")}
            onOpenSettings={() => nav.push({ name: "training", setId: BUILTIN_SET_ID, kind: "test" })}
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
            onSelectSection={selectSection}
            onOpenHelp={() => nav.push({ name: "help" })}
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
            onOpenQuiz={(lessonId) => openLessonQuiz(setId, lessonId)}
            onOpenQuestions={() => nav.push({ name: "setHome", setId })}
            onRetryMistakes={(ids) => begin(courseBank, ids, ids.length, "push")}
            onOpenSet={(id) => nav.push({ name: "setHome", setId: id })}
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
