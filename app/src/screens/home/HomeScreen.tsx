import clsx from "clsx";
import type { BankDiff } from "../../data/loadQuestions";
import type { QuestionBank } from "../../data/types";
import { useBankUpdate } from "../../features/bank/useBankUpdate";
import { promptInstall, useCanInstall } from "../../features/pwa/install";
import type { SessionLength } from "../../features/session/filters";
import { useSets } from "../../features/sets/SetsProvider";
import { formatShortDate } from "../../shared/lib/formatDate";
import { countQuestions, plural } from "../../shared/lib/plural";
import { Button, IconButton } from "../../shared/ui/Button";
import glass from "../../shared/ui/glass.module.css";
import { Icon } from "../../shared/ui/Icon";
import { Notice } from "../../shared/ui/Notice";
import { Screen } from "../../shared/ui/Screen";
import { SectionHeader, type Section } from "../../shared/ui/SectionSwitch";
import { UpdateBanner } from "../../features/pwa/AppUpdate";
import { TrainingStart } from "../training/TrainingStart";
import { getStartLabel, ModeCard, PoolHint } from "../training/TrainingControls";
import { BUILTIN_SET_ID } from "../../data/types";
import { useProgress } from "../../features/progress/ProgressProvider";
import { getBankStats } from "../../features/progress/stats";
import { getSummary } from "../../features/progress/summary";
import { TrainingSettingsPanel } from "../training/TrainingSettingsScreen";
import { useTrainingFilters } from "../training/useTrainingFilters";
import { useIsDesktop } from "../../shared/ui/useIsDesktop";
import styles from "./HomeScreen.module.css";

interface HomeScreenProps {
  onSelectSection: (section: Section) => void;
  bank: QuestionBank;
  onStart: (questionIds: string[], length: SessionLength) => void;
  onOpenSpeech: () => void;
  /** Экран «Настройка тренировки» тестовых вопросов основной базы. */
  onOpenSettings: () => void;
  onOpenSets: () => void;
  onOpenHelp: () => void;
  onUpdate: () => Promise<BankDiff>;
  /** На сервере база свежее — плашка «Вышла новая база». */
  newBank?: { onDismiss: () => void } | null;
  /** Незаконченная сессия с прошлого запуска. */
  resumable?: { text: string; onResume: () => void; onDiscard: () => void } | null;
}

const SET_FORMS = ["набор", "набора", "наборов"] as const;

/**
 * «Тренажёр» — раздел вопросов для подготовки к собеседованию: основная база, «Все / Новые / Ошибки», «Начать»,
 * устные вопросы и свои наборы. Подсказка новичку живёт в «Курсах» — первом экране приложения.
 */
export function HomeScreen({
  onSelectSection,
  bank,
  onStart,
  onOpenSettings,
  onOpenSets,
  onOpenSpeech,
  onOpenHelp,
  onUpdate,
  newBank,
  resumable,
}: HomeScreenProps) {
  const { sets } = useSets();
  const canInstall = useCanInstall();
  const update = useBankUpdate(onUpdate);
  const bankDate = formatShortDate(bank.generatedAt);
  const desktop = useIsDesktop();

  const notices = (
    <>
      {(update.state.kind === "done" || update.state.kind === "error") && (
        <Notice kind={update.state.kind === "done" ? "ok" : "error"} text={update.state.text} onClose={update.reset} />
      )}

      {newBank && update.state.kind !== "done" && (
        <div className={clsx(styles.helpHint, glass.glass)} role="status">
          <p>
            <b>Вышла новая база вопросов.</b> Обновить сейчас? Заметки, ответы и статистика сохранятся.
          </p>
          <div className={styles.helpHintButtons}>
            <Button icon="refresh" disabled={update.state.kind === "loading"} onClick={update.run}>
              {update.state.kind === "loading" ? "Обновляем…" : "Обновить"}
            </Button>
            <IconButton icon="close" label="Не сейчас" onClick={newBank.onDismiss} />
          </div>
        </div>
      )}

      {resumable && (
        <div className={clsx(styles.helpHint, glass.glass)} role="status">
          <p>
            <b>Незаконченная сессия</b> · {resumable.text}
          </p>
          <div className={styles.helpHintButtons}>
            <Button iconAfter="arrowRight" onClick={resumable.onResume}>
              Продолжить
            </Button>
            <IconButton icon="close" label="Не продолжать сессию" onClick={resumable.onDiscard} />
          </div>
        </div>
      )}
    </>
  );

  const tiles = (
    <div className={styles.tiles}>
      {bank.speech.length > 0 && (
        <button type="button" className={clsx(styles.tile, glass.glass)} onClick={onOpenSpeech}>
          <Icon name="speech" />
          <span className={styles.tileTitle}>Устные вопросы</span>
          <span className={styles.tileSub}>{countQuestions(bank.speech.length)}</span>
        </button>
      )}
      <button type="button" className={clsx(styles.tile, bank.speech.length === 0 && styles.wide, glass.glass)} onClick={onOpenSets}>
        <Icon name="folder" />
        <span className={styles.tileTitle}>Свои наборы</span>
        <span className={styles.tileSub}>{sets.length ? `${sets.length} ${plural(sets.length, SET_FORMS)}` : "По ссылке или файлом"}</span>
      </button>
    </div>
  );

  const subtitle = ["Вопросы для подготовки к собеседованию", countQuestions(bank.questions.length), bankDate && `база от ${bankDate}`]
    .filter(Boolean)
    .join(" · ");

  // Десктоп: слева настройка тренировки прямо на странице, справа прилипающая колонка — режим, «Начать», плитки.
  if (desktop) {
    return (
      <Screen width="wide">
        <SectionHeader section="trainer" title="Тренажёр" subtitle={subtitle} onSelect={onSelectSection} onOpenHelp={onOpenHelp}>
          <UpdateBanner />
        </SectionHeader>
        <DesktopTraining key={bank.generatedAt} bank={bank} onStart={onStart} side={<>{notices}</>} links={tiles} />
        {canInstall && (
          <Button variant="secondary" icon="download" onClick={promptInstall}>
            Установить приложение
          </Button>
        )}
      </Screen>
    );
  }

  return (
    <Screen>
      <SectionHeader
        section="trainer"
        title="Тренажёр"
        subtitle={[
          "Вопросы для подготовки к собеседованию",
          countQuestions(bank.questions.length),
          bankDate && `база от ${bankDate}`,
        ]
          .filter(Boolean)
          .join(" · ")}
        onSelect={onSelectSection}
        onOpenHelp={onOpenHelp}
      >
        <UpdateBanner />
      </SectionHeader>

      {(update.state.kind === "done" || update.state.kind === "error") && (
        <Notice kind={update.state.kind === "done" ? "ok" : "error"} text={update.state.text} onClose={update.reset} />
      )}

      {newBank && update.state.kind !== "done" && (
        <div className={clsx(styles.helpHint, glass.glass)} role="status">
          <p>
            <b>Вышла новая база вопросов.</b> Обновить сейчас? Заметки, ответы и статистика сохранятся.
          </p>
          <div className={styles.helpHintButtons}>
            <Button icon="refresh" disabled={update.state.kind === "loading"} onClick={update.run}>
              {update.state.kind === "loading" ? "Обновляем…" : "Обновить"}
            </Button>
            <IconButton icon="close" label="Не сейчас" onClick={newBank.onDismiss} />
          </div>
        </div>
      )}

      {resumable && (
        <div className={clsx(styles.helpHint, glass.glass)} role="status">
          <p>
            <b>Незаконченная сессия</b> · {resumable.text}
          </p>
          <div className={styles.helpHintButtons}>
            <Button iconAfter="arrowRight" onClick={resumable.onResume}>
              Продолжить
            </Button>
            <IconButton icon="close" label="Не продолжать сессию" onClick={resumable.onDiscard} />
          </div>
        </div>
      )}

      {/* key: после обновления базы выбор перечитывается — новые темы не должны потеряться */}
      <TrainingStart key={bank.generatedAt} bank={bank} kind="test" onStart={onStart} onOpenSettings={onOpenSettings} />

      {/* Две плитки в ряд; без устных вопросов «Свои наборы» — во всю ширину. */}
      <div className={styles.tiles}>
        {bank.speech.length > 0 && (
          <button type="button" className={clsx(styles.tile, glass.glass)} onClick={onOpenSpeech}>
            <Icon name="speech" />
            <span className={styles.tileTitle}>Устные вопросы</span>
            <span className={styles.tileSub}>{countQuestions(bank.speech.length)}</span>
          </button>
        )}
        <button
          type="button"
          className={clsx(styles.tile, bank.speech.length === 0 && styles.wide, glass.glass)}
          onClick={onOpenSets}
        >
          <Icon name="folder" />
          <span className={styles.tileTitle}>Свои наборы</span>
          <span className={styles.tileSub}>
            {sets.length ? `${sets.length} ${plural(sets.length, SET_FORMS)}` : "По ссылке или файлом"}
          </span>
        </button>
      </div>

      {canInstall && (
        <Button variant="secondary" icon="download" onClick={promptInstall}>
          Установить приложение
        </Button>
      )}
    </Screen>
  );
}

interface DesktopTrainingProps {
  bank: QuestionBank;
  onStart: (questionIds: string[], length: SessionLength) => void;
  /** Плашки новой базы и незаконченной сессии — наверху правой колонки. */
  side: React.ReactNode;
  /** Устные вопросы и свои наборы. */
  links: React.ReactNode;
}

const ANSWER_FORMS = ["ответ", "ответа", "ответов"] as const;
const DAY_FORMS = ["день", "дня", "дней"] as const;

/**
 * Тренажёр на десктопе. Слева сверху вниз — что тренировать: темы, уровень, сколько, какие вопросы, и в одной строке
 * галка «устные» и «Начать». Справа — куда ещё пойти и как дела: незаконченная сессия, устные вопросы, свои наборы,
 * итоги недели, прогресс по темам. Одно состояние фильтров на обе колонки.
 */
function DesktopTraining({ bank, onStart, side, links }: DesktopTrainingProps) {
  const training = useTrainingFilters(bank, "test");
  const { filters, pool, update } = training;
  const { records, getProgress } = useProgress();
  const summary = getSummary(records);
  const stats = getBankStats(bank, records, (id) => getProgress(BUILTIN_SET_ID, id));
  // Темы — в порядке базы, как слева, а не от отстающих: так глаз находит тему на том же месте.
  const topics = bank.topics.flatMap((t) => stats.topics.find((s) => s.id === t.id) ?? []);

  return (
    <div className={styles.desk}>
      <div className={styles.deskMain}>
        <TrainingSettingsPanel
          bank={bank}
          training={training}
          extra={<ModeCard training={training} />}
          action={
            <>
              <Button
                iconAfter="arrowRight"
                disabled={pool.length === 0}
                onClick={() =>
                  onStart(
                    pool.map((q) => q.id),
                    filters.length,
                  )
                }
              >
                {getStartLabel(filters.length, pool.length)}
              </Button>
              <PoolHint size={pool.length} />
            </>
          }
        />
      </div>
      <aside className={styles.deskSide}>
        {side}
        {links}
        {summary.answers > 0 && (
          <section className={clsx(styles.panel, glass.glass)} aria-label="Итоги за неделю">
            <h2 className={styles.panelTitle}>Неделя</h2>
            <div className={styles.week}>
              <span>
                <b>{summary.weekAnswers}</b>
                {plural(summary.weekAnswers, ANSWER_FORMS)}
              </span>
              <span>
                <b>{summary.weekAnswers ? `${summary.weekAccuracy}%` : "—"}</b>
                верно
              </span>
              <span>
                <b>{summary.days}</b>
                {plural(summary.days, DAY_FORMS)} подряд
              </span>
            </div>
          </section>
        )}
        <section className={clsx(styles.panel, glass.glass)} aria-label="Прогресс по темам">
          <h2 className={styles.panelTitle}>Прогресс по темам</h2>
          {topics.map((topic) => (
            <button
              key={topic.id}
              type="button"
              className={styles.topic}
              title="Тренировать только эту тему"
              onClick={() => update({ topics: [topic.id], excludedSubtopics: [] })}
            >
              <span className={styles.topicHead}>
                <span>{topic.title}</span>
                <span className={styles.topicCount}>
                  {topic.mastered} из {topic.total}
                </span>
              </span>
              <span className={styles.topicBar}>
                <i className={styles.barOk} style={{ width: `${(topic.mastered / topic.total) * 100}%` }} />
                <i className={styles.barBad} style={{ width: `${(topic.mistakes / topic.total) * 100}%` }} />
              </span>
            </button>
          ))}
          <span className={styles.legend}>
            <i className={styles.barOk} /> освоено <i className={styles.barBad} /> ошибки · щелчок — тренировать только эту тему
          </span>
        </section>
      </aside>
    </div>
  );
}
