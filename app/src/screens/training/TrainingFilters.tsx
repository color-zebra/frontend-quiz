import { useState } from "react";
import { LEVELS, type QuestionBank } from "../../data/types";
import {
  SESSION_LENGTHS,
  getPool,
  getSubtopicKey,
  loadFilters,
  saveFilters,
  toggleItem,
  type Filters,
  type SessionLength,
} from "../../features/session/filters";
import { QUESTION_FORMS, countQuestions, plural } from "../../shared/lib/plural";
import { Button } from "../../shared/ui/Button";
import { Card } from "../../shared/ui/Card";
import { Chip, ChipGroup } from "../../shared/ui/Chip";
import { Segmented } from "../../shared/ui/Segmented";
import { SubtopicsSheet } from "./SubtopicsSheet";
import styles from "./TrainingFilters.module.css";

interface TrainingFiltersProps {
  bank: QuestionBank;
  onStart: (questionIds: string[], length: SessionLength) => void;
}

const LEVEL_OPTIONS = LEVELS.map((l) => ({ value: l, label: l[0].toUpperCase() + l.slice(1) }));
const LENGTH_OPTIONS = SESSION_LENGTHS.map((l) => ({ value: l, label: l === "infinite" ? "∞" : String(l) }));

function getStartLabel(length: SessionLength, poolSize: number) {
  if (length === "infinite") return "Начать · без конца";
  const n = Math.min(length, poolSize);
  return `Начать · ${n} ${plural(n, QUESTION_FORMS)}`;
}

/** Выбор тем, подтем, уровней и длины сессии. Фильтры запоминаются отдельно для каждой базы. */
export function TrainingFilters({ bank, onStart }: TrainingFiltersProps) {
  const [filters, setFilters] = useState(() => loadFilters(bank));
  const [subtopicsOpen, setSubtopicsOpen] = useState(false);
  const pool = getPool(bank, filters);

  const selectedTopics = bank.topics.filter((t) => filters.topics.includes(t.id));
  const subtopicKeys = selectedTopics.flatMap((t) => t.subtopics.map((s) => getSubtopicKey(t.id, s.id)));
  const enabledSubtopics = subtopicKeys.filter((key) => !filters.excludedSubtopics.includes(key)).length;

  function update(patch: Partial<Filters>) {
    const next = { ...filters, ...patch };
    setFilters(next);
    saveFilters(bank, next);
  }

  return (
    <>
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
      <p className={styles.hint}>
        {pool.length === 0
          ? "Под фильтр ничего не подходит — включи темы или уровни"
          : `Под фильтр подходит ${countQuestions(pool.length)}`}
      </p>

      <SubtopicsSheet
        open={subtopicsOpen}
        bank={bank}
        filters={filters}
        onChange={(excludedSubtopics) => update({ excludedSubtopics })}
        onClose={() => setSubtopicsOpen(false)}
      />
    </>
  );
}
