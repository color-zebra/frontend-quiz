import clsx from "clsx";
import { useState } from "react";
import type { BankDiff } from "../../data/loadQuestions";
import { LEVELS, type QuestionBank } from "../../data/types";
import { useNotes } from "../../features/notes/NotesProvider";
import { promptInstall, useCanInstall } from "../../features/pwa/install";
import {
  SESSION_LENGTHS,
  getPool,
  getSubtopicKey,
  toggleItem,
  type Filters,
  type SessionLength,
} from "../../features/session/filters";
import { NOTE_FORMS, QUESTION_FORMS, countQuestions, plural } from "../../shared/lib/plural";
import { Brand } from "../../shared/ui/Brand";
import { Button, IconButton } from "../../shared/ui/Button";
import { Card } from "../../shared/ui/Card";
import { Chip, ChipGroup } from "../../shared/ui/Chip";
import glass from "../../shared/ui/glass.module.css";
import { Icon } from "../../shared/ui/Icon";
import { Screen, TopBar } from "../../shared/ui/Screen";
import { ScreenTitle } from "../../shared/ui/ScreenTitle";
import { Segmented } from "../../shared/ui/Segmented";
import { THEMES, type ThemeId } from "../../theme/themes";
import styles from "./HomeScreen.module.css";
import { SubtopicsSheet } from "./SubtopicsSheet";

interface HomeScreenProps {
  bank: QuestionBank;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onStart: () => void;
  onOpenNotes: () => void;
  onUpdate: () => Promise<BankDiff>;
  theme: ThemeId;
  onOpenTheme: () => void;
}

const LEVEL_OPTIONS = LEVELS.map((l) => ({ value: l, label: l[0].toUpperCase() + l.slice(1) }));
const LENGTH_OPTIONS = SESSION_LENGTHS.map((l) => ({ value: l, label: l === "infinite" ? "∞" : String(l) }));

function getStartLabel(length: SessionLength, poolSize: number) {
  if (length === "infinite") return "Начать · без конца";
  const n = Math.min(length, poolSize);
  return `Начать · ${n} ${plural(n, QUESTION_FORMS)}`;
}

type UpdateState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; diff: BankDiff }
  | { kind: "error"; message: string };

function formatDiff({ added, changed, removed }: BankDiff) {
  const parts = [
    added && `новых ${added}`,
    changed && `исправлено ${changed}`,
    removed && `удалено ${removed}`,
  ].filter(Boolean);
  return parts.length ? `База обновлена: ${parts.join(", ")}.` : "У тебя самая свежая база.";
}

function formatBankDate(iso: string | undefined) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return new Intl.DateTimeFormat("ru", { day: "numeric", month: "long", year: sameYear ? undefined : "numeric" }).format(date);
}

export function HomeScreen({
  bank,
  filters,
  onFiltersChange,
  onStart,
  onOpenNotes,
  onUpdate,
  theme,
  onOpenTheme,
}: HomeScreenProps) {
  const { notes } = useNotes();
  const canInstall = useCanInstall();
  const [subtopicsOpen, setSubtopicsOpen] = useState(false);
  const [updateState, setUpdateState] = useState<UpdateState>({ kind: "idle" });
  const bankDate = formatBankDate(bank.generatedAt);

  function refreshBank() {
    setUpdateState({ kind: "loading" });
    onUpdate().then(
      (diff) => setUpdateState({ kind: "done", diff }),
      (error: unknown) =>
        setUpdateState({ kind: "error", message: error instanceof Error ? error.message : "Неизвестная ошибка" }),
    );
  }
  const pool = getPool(bank, filters);

  const selectedTopics = bank.topics.filter((t) => filters.topics.includes(t.id));
  const subtopicKeys = selectedTopics.flatMap((t) => t.subtopics.map((s) => getSubtopicKey(t.id, s.id)));
  const enabledSubtopics = subtopicKeys.filter((key) => !filters.excludedSubtopics.includes(key)).length;

  function update(patch: Partial<Filters>) {
    onFiltersChange({ ...filters, ...patch });
  }

  return (
    <Screen>
      <TopBar>
        <Brand />
        <div className={styles.topActions}>
          <IconButton
            icon="refresh"
            label="Обновить базу"
            className={clsx(updateState.kind === "loading" && styles.spinning)}
            disabled={updateState.kind === "loading"}
            onClick={refreshBank}
          />
          <IconButton icon="palette" label="Оформление" onClick={onOpenTheme} />
        </div>
      </TopBar>

      <ScreenTitle
        title="Что тренируем?"
        subtitle={[countQuestions(bank.questions.length), bankDate && `база от ${bankDate}`].filter(Boolean).join(" · ")}
      />

      {(updateState.kind === "done" || updateState.kind === "error") && (
        <div className={clsx(styles.updateMessage, glass.glass, updateState.kind === "error" && styles.updateError)} role="status">
          <span>
            {updateState.kind === "done" ? formatDiff(updateState.diff) : `Не удалось обновить: ${updateState.message}`}
          </span>
          <button type="button" className={styles.dismiss} aria-label="Скрыть" onClick={() => setUpdateState({ kind: "idle" })}>
            <Icon name="close" />
          </button>
        </div>
      )}

      <Card label="Темы">
        <ChipGroup>
          {bank.topics.map((topic) => (
            <Chip
              key={topic.id}
              label={topic.title}
              count={bank.questions.filter((q) => q.topic === topic.id).length}
              on={filters.topics.includes(topic.id)}
              onClick={() => update({ topics: toggleItem(filters.topics, topic.id) })}
            />
          ))}
        </ChipGroup>
        <button
          type="button"
          className={styles.subtopics}
          disabled={selectedTopics.length === 0}
          onClick={() => setSubtopicsOpen(true)}
        >
          <span>Подтемы</span>
          <span>
            <b>
              {enabledSubtopics === subtopicKeys.length ? `все ${subtopicKeys.length}` : `${enabledSubtopics} из ${subtopicKeys.length}`}
            </b>{" "}
            ›
          </span>
        </button>
      </Card>

      <Card label="Уровень">
        <Segmented
          label="Уровень"
          options={LEVEL_OPTIONS}
          isOn={(level) => filters.levels.includes(level)}
          onSelect={(level) => update({ levels: LEVELS.filter((l) => toggleItem(filters.levels, level).includes(l)) })}
        />
      </Card>

      <Card label="Сколько вопросов">
        <Segmented
          label="Сколько вопросов"
          options={LENGTH_OPTIONS}
          isOn={(length) => filters.length === length}
          onSelect={(length) => update({ length })}
        />
      </Card>

      <Button iconAfter="arrowRight" disabled={pool.length === 0} onClick={onStart}>
        {getStartLabel(filters.length, pool.length)}
      </Button>
      <p className={styles.hint}>
        {pool.length === 0
          ? "Под фильтр ничего не подходит — включи темы или уровни"
          : `Под фильтр подходит ${countQuestions(pool.length)}`}
      </p>

      <div className={styles.tiles}>
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

      <SubtopicsSheet
        open={subtopicsOpen}
        bank={bank}
        filters={filters}
        onChange={(excludedSubtopics) => update({ excludedSubtopics })}
        onClose={() => setSubtopicsOpen(false)}
      />
    </Screen>
  );
}
