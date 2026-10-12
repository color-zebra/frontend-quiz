import type { QuestionBank } from "../../data/types";
import { getSubtopicKey, toggleItem, type Filters } from "../../features/session/filters";
import { Chip, ChipGroup } from "../../shared/ui/Chip";
import { Sheet } from "../../shared/ui/Sheet";
import styles from "./SubtopicsSheet.module.css";

interface SubtopicsSheetProps {
  open: boolean;
  bank: QuestionBank;
  filters: Filters;
  onChange: (excludedSubtopics: string[]) => void;
  onClose: () => void;
}

/** Подтемы выбранных тем. Выключенная подтема попадает в excludedSubtopics. */
export function SubtopicsSheet({ open, bank, filters, onChange, onClose }: SubtopicsSheetProps) {
  const topics = bank.topics.filter((t) => filters.topics.includes(t.id));

  return (
    <Sheet open={open} title="Подтемы" onClose={onClose}>
      <div className={styles.topics}>
        {topics.map((topic) => {
          const keys = topic.subtopics.map((s) => getSubtopicKey(topic.id, s.id));
          const allOn = keys.every((key) => !filters.excludedSubtopics.includes(key));
          const othersExcluded = filters.excludedSubtopics.filter((key) => !keys.includes(key));

          return (
            <section key={topic.id} className={styles.topic}>
              <header className={styles.header}>
                <h3 className={styles.title}>{topic.title}</h3>
                <button
                  type="button"
                  className={styles.toggleAll}
                  onClick={() => onChange(allOn ? [...othersExcluded, ...keys] : othersExcluded)}
                >
                  {allOn ? "Снять все" : "Выбрать все"}
                </button>
              </header>
              <ChipGroup>
                {topic.subtopics.map((sub) => {
                  const key = getSubtopicKey(topic.id, sub.id);
                  return (
                    <Chip
                      key={key}
                      label={sub.title}
                      count={bank.questions.filter((q) => q.topic === topic.id && q.subtopic === sub.id).length}
                      on={!filters.excludedSubtopics.includes(key)}
                      onClick={() => onChange(toggleItem(filters.excludedSubtopics, key))}
                    />
                  );
                })}
              </ChipGroup>
            </section>
          );
        })}
      </div>
    </Sheet>
  );
}
