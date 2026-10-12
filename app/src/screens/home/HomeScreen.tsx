import clsx from "clsx";
import { useState } from "react";
import { formatDiff } from "../../data/formatDiff";
import type { BankDiff } from "../../data/loadQuestions";
import type { QuestionBank } from "../../data/types";
import { useNotes } from "../../features/notes/NotesProvider";
import { promptInstall, useCanInstall } from "../../features/pwa/install";
import type { SessionLength } from "../../features/session/filters";
import { useSets } from "../../features/sets/SetsProvider";
import { formatShortDate } from "../../shared/lib/formatDate";
import { NOTE_FORMS, countQuestions, plural } from "../../shared/lib/plural";
import { Brand } from "../../shared/ui/Brand";
import { Button, IconButton } from "../../shared/ui/Button";
import glass from "../../shared/ui/glass.module.css";
import { Icon } from "../../shared/ui/Icon";
import { Notice } from "../../shared/ui/Notice";
import { Screen, TopBar } from "../../shared/ui/Screen";
import { ScreenTitle } from "../../shared/ui/ScreenTitle";
import { THEMES, type ThemeId } from "../../theme/themes";
import { TrainingFilters } from "../training/TrainingFilters";
import styles from "./HomeScreen.module.css";

interface HomeScreenProps {
  bank: QuestionBank;
  onStart: (questionIds: string[], length: SessionLength) => void;
  onOpenNotes: () => void;
  onOpenSets: () => void;
  onUpdate: () => Promise<BankDiff>;
  theme: ThemeId;
  onOpenTheme: () => void;
}

type UpdateState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; diff: BankDiff }
  | { kind: "error"; message: string };

const SET_FORMS = ["набор", "набора", "наборов"] as const;

export function HomeScreen({ bank, onStart, onOpenNotes, onOpenSets, onUpdate, theme, onOpenTheme }: HomeScreenProps) {
  const { notes } = useNotes();
  const { sets } = useSets();
  const canInstall = useCanInstall();
  const [updateState, setUpdateState] = useState<UpdateState>({ kind: "idle" });
  const bankDate = formatShortDate(bank.generatedAt);

  function refreshBank() {
    setUpdateState({ kind: "loading" });
    onUpdate().then(
      (diff) => setUpdateState({ kind: "done", diff }),
      (error: unknown) =>
        setUpdateState({ kind: "error", message: error instanceof Error ? error.message : "Неизвестная ошибка" }),
    );
  }

  return (
    <Screen>
      <TopBar>
        <Brand />
        <div className={styles.topActions}>
          <IconButton icon="refresh" label="Обновить базу" busy={updateState.kind === "loading"} onClick={refreshBank} />
          <IconButton icon="palette" label="Оформление" onClick={onOpenTheme} />
        </div>
      </TopBar>

      <ScreenTitle
        title="Что тренируем?"
        subtitle={[countQuestions(bank.questions.length), bankDate && `база от ${bankDate}`].filter(Boolean).join(" · ")}
      />

      {updateState.kind === "done" && (
        <Notice
          kind="ok"
          text={formatDiff(updateState.diff, "База обновлена", "У тебя самая свежая база.")}
          onClose={() => setUpdateState({ kind: "idle" })}
        />
      )}
      {updateState.kind === "error" && (
        <Notice
          kind="error"
          text={`Не удалось обновить: ${updateState.message}`}
          onClose={() => setUpdateState({ kind: "idle" })}
        />
      )}

      {/* key: после обновления базы фильтры перечитываются — новые темы не должны потеряться */}
      <TrainingFilters key={bank.generatedAt} bank={bank} onStart={onStart} />

      <div className={styles.tiles}>
        <button type="button" className={clsx(styles.tile, styles.wide, glass.glass)} onClick={onOpenSets}>
          <Icon name="folder" />
          <span className={styles.tileTitle}>Мои наборы</span>
          <span className={styles.tileSub}>
            {sets.length ? `${sets.length} ${plural(sets.length, SET_FORMS)}` : "Свои вопросы из YAML-файла на GitHub"}
          </span>
        </button>
        <button type="button" className={clsx(styles.tile, glass.glass)} onClick={onOpenNotes}>
          <Icon name="pencil" />
          <span className={styles.tileTitle}>Мои заметки</span>
          <span className={styles.tileSub}>
            {notes.size} {plural(notes.size, NOTE_FORMS)}
          </span>
        </button>
        <button type="button" className={clsx(styles.tile, glass.glass)} onClick={onOpenTheme}>
          <Icon name="palette" />
          <span className={styles.tileTitle}>Оформление</span>
          <span className={styles.tileSub}>{THEMES.find((t) => t.id === theme)?.name}</span>
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
