import clsx from "clsx";
import { LEVELS, type QuestionBank } from "../../data/types";
import { getSubtopicKey, type Filters, type SessionLength, type TrainingKind } from "../../features/session/filters";
import { Button } from "../../shared/ui/Button";
import glass from "../../shared/ui/glass.module.css";
import { Icon } from "../../shared/ui/Icon";
import { ModeCard, PoolHint, getStartLabel } from "./TrainingControls";
import styles from "./TrainingStart.module.css";
import { useTrainingFilters, type TrainingFiltersState } from "./useTrainingFilters";

interface TrainingStartProps {
  bank: QuestionBank;
  /** Раздел: тестовые вопросы или устные. У каждого свои сохранённые фильтры. */
  kind: TrainingKind;
  onStart: (questionIds: string[], length: SessionLength) => void;
  /** Экран «Настройка тренировки»: темы, подтемы, уровни, длина. */
  onOpenSettings: () => void;
}

/** Сколько тем называть по имени, остальные — «и ещё N». */
const NAMED_TOPICS = 3;

function describeTopics(bank: QuestionBank, filters: Filters) {
  const selected = bank.topics.filter((t) => filters.topics.includes(t.id));
  if (selected.length === 0) return "Темы не выбраны";
  if (bank.topics.length > 1 && selected.length === bank.topics.length) return "Все темы";
  const named = selected.slice(0, NAMED_TOPICS).map((t) => t.title).join(", ");
  return selected.length > NAMED_TOPICS ? `${named} и ещё ${selected.length - NAMED_TOPICS}` : named;
}

/** Строка под темами: подтемы, уровни, устные вперемешку. */
function describeDetails(bank: QuestionBank, filters: Filters, withSpeech: boolean) {
  const parts: string[] = [];
  // Подтемы считаем только у тем, где их больше одной: у остальных выбирать нечего.
  const keys = bank.topics
    .filter((t) => filters.topics.includes(t.id) && t.subtopics.length > 1)
    .flatMap((t) => t.subtopics.map((s) => getSubtopicKey(t.id, s.id)));
  if (keys.length) {
    const enabled = keys.filter((key) => !filters.excludedSubtopics.includes(key)).length;
    parts.push(enabled === keys.length ? "все подтемы" : `подтемы ${enabled} из ${keys.length}`);
  }
  if (filters.levels.length === LEVELS.length) parts.push("все уровни");
  else if (filters.levels.length === 0) parts.push("уровень не выбран");
  else parts.push(filters.levels.map((l) => l[0].toUpperCase() + l.slice(1)).join(", "));
  if (withSpeech) parts.push("с устными");
  return parts.join(" · ");
}

/** Запуск тренировки: что выбрано, «Все / Новые / Ошибки» и «Начать». Сам выбор — на экране настройки. */
export function TrainingStart({ bank, kind, onStart, onOpenSettings }: TrainingStartProps) {
  const training = useTrainingFilters(bank, kind);
  const { filters, canMixSpeech } = training;

  return (
    <>
      <button type="button" className={clsx(styles.summary, glass.glass)} onClick={onOpenSettings}>
        <span className={styles.head}>
          <span className={styles.label}>Тренировка</span>
          <span className={styles.change}>
            Изменить
            <Icon name="chevronRight" />
          </span>
        </span>
        <span className={styles.topics}>{describeTopics(bank, filters)}</span>
        <span className={styles.details}>{describeDetails(bank, filters, canMixSpeech && filters.withSpeech)}</span>
      </button>

      <StartControls training={training} onStart={onStart} />
    </>
  );
}

/** «Все / Новые / Ошибки», «Начать · 20 вопросов» и сколько подходит под фильтр. */
export function StartControls({ training, onStart }: { training: TrainingFiltersState; onStart: TrainingStartProps["onStart"] }) {
  const { filters, pool } = training;
  return (
    <>
      <ModeCard training={training} />

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
  );
}
