import clsx from "clsx";
import { useState } from "react";
import type { BankDiff } from "../../data/loadQuestions";
import type { QuestionBank } from "../../data/types";
import { useBankUpdate } from "../../features/bank/useBankUpdate";
import { promptInstall, useCanInstall } from "../../features/pwa/install";
import type { SessionLength } from "../../features/session/filters";
import { useSets } from "../../features/sets/SetsProvider";
import { formatShortDate } from "../../shared/lib/formatDate";
import { readStorage, writeStorage } from "../../shared/lib/storage";
import { countQuestions, plural } from "../../shared/lib/plural";
import { Brand } from "../../shared/ui/Brand";
import { Button, IconButton } from "../../shared/ui/Button";
import glass from "../../shared/ui/glass.module.css";
import { Icon } from "../../shared/ui/Icon";
import { Notice } from "../../shared/ui/Notice";
import { Screen, TopBar } from "../../shared/ui/Screen";
import { ScreenTitle } from "../../shared/ui/ScreenTitle";
import { TrainingFilters } from "../training/TrainingFilters";
import styles from "./HomeScreen.module.css";

interface HomeScreenProps {
  bank: QuestionBank;
  onStart: (questionIds: string[], length: SessionLength) => void;
  onOpenSpeech: () => void;
  onOpenCabinet: () => void;
  onOpenSets: () => void;
  onOpenHelp: () => void;
  onUpdate: () => Promise<BankDiff>;
  /** На сервере база свежее — плашка «Вышла новая база». */
  newBank?: { onDismiss: () => void } | null;
  /** Незаконченная сессия с прошлого запуска. */
  resumable?: { text: string; onResume: () => void; onDiscard: () => void } | null;
}

const SET_FORMS = ["набор", "набора", "наборов"] as const;

/** Плашку для новичков показываем, пока её не закрыли и не открыли инструкцию. */
const HELP_HINT_KEY = "fq.helpHintSeen";

export function HomeScreen({
  bank,
  onStart,
  onOpenCabinet,
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
  const [showHelpHint, setShowHelpHint] = useState(() => readStorage(HELP_HINT_KEY) === null);

  function hideHelpHint() {
    setShowHelpHint(false);
    writeStorage(HELP_HINT_KEY, "1");
  }

  function openHelp() {
    hideHelpHint();
    onOpenHelp();
  }

  return (
    <Screen>
      <TopBar>
        <Brand />
        <div className={styles.topActions}>
          <IconButton icon="user" label="Кабинет" onClick={onOpenCabinet} />
          <IconButton icon="help" label="Помощь" onClick={openHelp} />
        </div>
      </TopBar>

      <ScreenTitle
        title="Что тренируем?"
        subtitle={[countQuestions(bank.questions.length), bankDate && `база от ${bankDate}`].filter(Boolean).join(" · ")}
      />

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

      {showHelpHint && (
        <div className={clsx(styles.helpHint, glass.glass)}>
          <p>
            <b>Впервые здесь?</b> В инструкции — как тренироваться, установить приложение на телефон и добавить свои
            вопросы.
          </p>
          <div className={styles.helpHintButtons}>
            <Button icon="help" onClick={openHelp}>
              Открыть инструкцию
            </Button>
            <IconButton icon="close" label="Скрыть подсказку" onClick={hideHelpHint} />
          </div>
        </div>
      )}

      {/* key: после обновления базы фильтры перечитываются — новые темы не должны потеряться */}
      <TrainingFilters key={bank.generatedAt} bank={bank} kind="test" onStart={onStart} />

      <div className={styles.tiles}>
        {bank.speech.length > 0 && (
          <button type="button" className={clsx(styles.tile, styles.wide, glass.glass)} onClick={onOpenSpeech}>
            <Icon name="speech" />
            <span className={styles.tileTitle}>Устные вопросы</span>
            <span className={styles.tileSub}>
              {countQuestions(bank.speech.length)} · ответь сам, потом сверься с эталоном
            </span>
          </button>
        )}
        <button type="button" className={clsx(styles.tile, styles.wide, glass.glass)} onClick={onOpenSets}>
          <Icon name="folder" />
          <span className={styles.tileTitle}>Мои наборы</span>
          <span className={styles.tileSub}>
            {sets.length ? `${sets.length} ${plural(sets.length, SET_FORMS)}` : "Свои вопросы — из файла или по ссылке"}
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
