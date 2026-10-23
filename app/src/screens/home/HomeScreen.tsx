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
import { StartControls, TrainingStart } from "../training/TrainingStart";
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
        <DesktopTraining key={bank.generatedAt} bank={bank} onStart={onStart} side={<>{notices}</>} below={tiles} />
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
  /** Над «Все / Новые / Ошибки»: плашки новой базы и незаконченной сессии. */
  side: React.ReactNode;
  /** Под кнопкой «Начать»: устные вопросы и свои наборы. */
  below: React.ReactNode;
}

/** Две колонки тренажёра на десктопе: одно состояние фильтров на обе — что выбрал слева, то и начнётся справа. */
function DesktopTraining({ bank, onStart, side, below }: DesktopTrainingProps) {
  const training = useTrainingFilters(bank, "test");
  return (
    <div className={styles.desk}>
      <div className={styles.deskMain}>
        <TrainingSettingsPanel bank={bank} training={training} />
      </div>
      <aside className={styles.deskSide}>
        {side}
        <StartControls training={training} onStart={onStart} />
        {below}
      </aside>
    </div>
  );
}
