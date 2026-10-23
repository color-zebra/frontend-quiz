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


/**
 * Тренажёр на десктопе. Слева — темы (в две колонки). Справа сверху вниз — всё, что нужно для запуска: незаконченная
 * сессия и одной карточкой уровень, сколько вопросов, какие, устные вперемешку и «Начать». Под темами — устные
 * вопросы и свои наборы. Так страница помещается в окно ноутбука. Прогресс по темам — в боковом меню.
 */
function DesktopTraining({ bank, onStart, side, links }: DesktopTrainingProps) {
  const training = useTrainingFilters(bank, "test");
  const { filters, pool } = training;

  return (
    <div className={styles.desk}>
      <div className={styles.deskMain}>
        <TrainingSettingsPanel bank={bank} training={training} part="topics" />
        {links}
      </div>
      <aside className={styles.deskSide}>
        {side}
        {/* Уровень, длина, какие вопросы и устные — одной карточкой: три отдельные не помещались в окно ноутбука. */}
        <div className={clsx(styles.filters, glass.glass)}>
        <TrainingSettingsPanel
          bank={bank}
          training={training}
          part="filters"
          extra={<ModeCard training={training} />}
          action={
            <div className={styles.start}>
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
            </div>
          }
        />
        </div>
      </aside>
    </div>
  );
}

