import type { SessionLength } from "../../features/session/filters";
import { QUESTION_FORMS, countQuestions, plural } from "../../shared/lib/plural";
import { Card } from "../../shared/ui/Card";
import { Segmented } from "../../shared/ui/Segmented";
import styles from "./TrainingControls.module.css";
import type { TrainingFiltersState } from "./useTrainingFilters";

export function getStartLabel(length: SessionLength, poolSize: number) {
  if (length === "infinite") return "Начать · без конца";
  const n = Math.min(length, poolSize);
  return `Начать · ${n} ${plural(n, QUESTION_FORMS)}`;
}

/** «Все / Новые / Ошибки» — и на главной, и на экране настройки: переключают чаще всего. */
export function ModeCard({ training }: { training: TrainingFiltersState }) {
  const { counts, mode, update } = training;
  return (
    <Card label="Какие вопросы">
      <Segmented
        label="Какие вопросы"
        options={[
          { value: "all", label: "Все", count: counts.all },
          { value: "new", label: "Новые", count: counts.new, disabled: counts.new === 0 },
          { value: "mistakes", label: "Ошибки", count: counts.mistakes, disabled: counts.mistakes === 0 },
        ]}
        isOn={(m) => mode === m}
        onSelect={(m) => update({ mode: m })}
      />
    </Card>
  );
}

export function PoolHint({ size }: { size: number }) {
  return (
    <p className={styles.hint}>
      {size === 0 ? "Под фильтр ничего не подходит — включи темы или уровни" : `Под фильтр подходит ${countQuestions(size)}`}
    </p>
  );
}
