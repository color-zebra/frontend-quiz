import clsx from "clsx";
import { useState, type ReactNode } from "react";
import { LEVELS, type QuestionBank, type Topic } from "../../data/types";
import {
  SESSION_LENGTHS,
  getSubtopicKey,
  toggleItem,
  type SessionLength,
  type TrainingKind,
} from "../../features/session/filters";
import { countQuestions, plural } from "../../shared/lib/plural";
import { Button, IconButton } from "../../shared/ui/Button";
import { Card, SectionLabel } from "../../shared/ui/Card";
import { Icon } from "../../shared/ui/Icon";
import { ActionBar, Screen, TopBar } from "../../shared/ui/Screen";
import { ScreenTitle } from "../../shared/ui/ScreenTitle";
import { Segmented } from "../../shared/ui/Segmented";
import { SubtopicsSheet } from "./SubtopicsSheet";
import { ModeCard, PoolHint, getStartLabel } from "./TrainingControls";
import styles from "./TrainingSettingsScreen.module.css";
import { useTrainingFilters, type TrainingFiltersState } from "./useTrainingFilters";

interface TrainingSettingsScreenProps {
  bank: QuestionBank;
  kind: TrainingKind;
  /** Откуда вопросы: «Тестовые вопросы», «Устные вопросы», «Набор «…»». */
  subtitle: string;
  onBack: () => void;
  onStart: (questionIds: string[], length: SessionLength) => void;
}

const LEVEL_OPTIONS = LEVELS.map((l) => ({ value: l, label: l[0].toUpperCase() + l.slice(1) }));
const LENGTH_OPTIONS = SESSION_LENGTHS.map((l) => ({ value: l, label: l === "infinite" ? "∞" : String(l) }));
const SUBTOPIC_FORMS = ["подтема", "подтемы", "подтем"] as const;

/** Выбор тем, подтем, уровней и длины сессии. Выбор запоминается отдельно для каждой базы и раздела. */
export function TrainingSettingsScreen({ bank, kind, subtitle, onBack, onStart }: TrainingSettingsScreenProps) {
  const training = useTrainingFilters(bank, kind);
  const { filters, pool } = training;

  return (
    <Screen>
      <TopBar>
        <IconButton icon="arrowLeft" label="Назад" onClick={onBack} />
      </TopBar>
      <ScreenTitle title="Настройка тренировки" subtitle={subtitle} />

      <ModeCard training={training} />

      <TrainingSettingsPanel bank={bank} training={training} />

      <PoolHint size={pool.length} />

      <ActionBar>
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
      </ActionBar>
    </Screen>
  );
}

/**
 * Темы, уровень, длина и устные вперемешку — без режима и кнопки «Начать». На телефоне это экран настройки,
 * на десктопе — левая колонка «Тренажёра»: настройка прямо на месте, без перехода.
 */
export function TrainingSettingsPanel({
  bank,
  training,
  extra,
  action,
}: {
  bank: QuestionBank;
  training: TrainingFiltersState;
  /** После «Сколько вопросов» — на десктопе «Какие вопросы». */
  extra?: ReactNode;
  /** Справа в строке с галкой «Добавлять устные вопросы» — на десктопе «Начать». */
  action?: ReactNode;
}) {
  const { filters, update, canMixSpeech } = training;
  const [sheetTopicId, setSheetTopicId] = useState<string | null>(null);
  // Одна тема без подтем (маленький свой набор) — выбирать нечего, карточку тем не показываем.
  const hasTopicChoice = bank.topics.length > 1 || bank.topics.some((t) => t.subtopics.length > 1);
  const allTopicsOn = bank.topics.every((t) => filters.topics.includes(t.id));
  const speechToggle = (
    <label className={styles.toggle}>
      <input type="checkbox" checked={filters.withSpeech} onChange={(e) => update({ withSpeech: e.target.checked })} />
      <span>
        <b>Добавлять устные вопросы</b>
        <span className={styles.toggleHint}>Из тех же тем и уровней — для разнообразия</span>
      </span>
    </label>
  );

  return (
    <>
      {hasTopicChoice && (
        <Card>
          <div className={styles.cardHead}>
            <SectionLabel>Темы</SectionLabel>
            <button
              type="button"
              className={styles.cardAction}
              onClick={() =>
                update(allTopicsOn ? { topics: [] } : { topics: bank.topics.map((t) => t.id), excludedSubtopics: [] })
              }
            >
              {allTopicsOn ? "Снять все" : "Выбрать все"}
            </button>
          </div>
          <div className={styles.rows}>
            {bank.topics.map((topic) => (
              <TopicRow key={topic.id} topic={topic} training={training} onOpenSubtopics={() => setSheetTopicId(topic.id)} />
            ))}
          </div>
        </Card>
      )}

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

      {extra}

      {action ? (
        <div className={styles.actionRow}>
          {canMixSpeech ? speechToggle : <span />}
          <div className={styles.action}>{action}</div>
        </div>
      ) : (
        canMixSpeech && speechToggle
      )}

      <SubtopicsSheet
        topic={bank.topics.find((t) => t.id === sheetTopicId) ?? null}
        training={training}
        onClose={() => setSheetTopicId(null)}
      />
    </>
  );
}

interface TopicRowProps {
  topic: Topic;
  training: TrainingFiltersState;
  onOpenSubtopics: () => void;
}

/** Строка темы: галка с числом вопросов и, если подтем несколько, кнопка их выбора. */
function TopicRow({ topic, training, onOpenSubtopics }: TopicRowProps) {
  const { filters, update, source } = training;
  const on = filters.topics.includes(topic.id);
  const keys = topic.subtopics.map((s) => getSubtopicKey(topic.id, s.id));
  const enabled = keys.filter((key) => !filters.excludedSubtopics.includes(key)).length;
  const isPartial = on && enabled < keys.length;
  const subtopicsText = isPartial ? `${enabled} из ${keys.length}` : `${keys.length} ${plural(keys.length, SUBTOPIC_FORMS)}`;

  function toggle() {
    if (on) {
      update({ topics: filters.topics.filter((id) => id !== topic.id) });
      return;
    }
    // Все подтемы темы были выключены — включаем тему целиком, иначе галка ничего бы не дала.
    const excludedSubtopics = enabled === 0 ? filters.excludedSubtopics.filter((key) => !keys.includes(key)) : filters.excludedSubtopics;
    update({ topics: [...filters.topics, topic.id], excludedSubtopics });
  }

  return (
    <div className={styles.row}>
      <button type="button" className={styles.rowToggle} aria-pressed={on} onClick={toggle}>
        <span className={clsx(styles.box, on && styles.boxOn)}>{on && <Icon name="check" />}</span>
        <span className={styles.rowText}>
          <span className={styles.rowTitle}>{topic.title}</span>
          <span className={styles.rowSub}>{countQuestions(source.filter((q) => q.topic === topic.id).length)}</span>
        </span>
      </button>
      {keys.length > 1 && (
        <button
          type="button"
          className={clsx(styles.subtopics, isPartial && styles.partial, !on && styles.off)}
          aria-label={`Подтемы «${topic.title}»: ${subtopicsText}`}
          onClick={onOpenSubtopics}
        >
          {subtopicsText}
          <Icon name="chevronRight" />
        </button>
      )}
    </div>
  );
}
