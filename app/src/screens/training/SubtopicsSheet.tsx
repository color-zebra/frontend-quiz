import type { Topic } from "../../data/types";
import { getSubtopicKey } from "../../features/session/filters";
import { Button } from "../../shared/ui/Button";
import { Chip, ChipGroup } from "../../shared/ui/Chip";
import { Sheet } from "../../shared/ui/Sheet";
import styles from "./SubtopicsSheet.module.css";
import type { TrainingFiltersState } from "./useTrainingFilters";

interface SubtopicsSheetProps {
  /** Чьи подтемы показываем; null — шторка закрыта. */
  topic: Topic | null;
  training: TrainingFiltersState;
  onClose: () => void;
}

/**
 * Подтемы одной темы. Тема выбрана, пока выбрана хоть одна её подтема: включил подтему у невыбранной темы — тема
 * включилась, снял последнюю — тема выключилась. Выключенная подтема попадает в excludedSubtopics.
 */
export function SubtopicsSheet({ topic, training, onClose }: SubtopicsSheetProps) {
  return (
    <Sheet open={topic !== null} title={topic?.title ?? ""} onClose={onClose} footer={<Button onClick={onClose}>Готово</Button>}>
      {topic && <SubtopicsList topic={topic} training={training} />}
    </Sheet>
  );
}

function SubtopicsList({ topic, training }: { topic: Topic; training: TrainingFiltersState }) {
  const { filters, update, source } = training;
  const topicOn = filters.topics.includes(topic.id);
  const keys = topic.subtopics.map((s) => getSubtopicKey(topic.id, s.id));
  const isOn = (key: string) => topicOn && !filters.excludedSubtopics.includes(key);
  const onKeys = keys.filter(isOn);
  const otherExcluded = filters.excludedSubtopics.filter((key) => !keys.includes(key));

  function select(next: readonly string[]) {
    if (next.length === 0) {
      // Без единой подтемы тема выключается, а её подтемы при следующем включении — снова все.
      update({ topics: filters.topics.filter((id) => id !== topic.id), excludedSubtopics: otherExcluded });
      return;
    }
    update({
      topics: topicOn ? filters.topics : [...filters.topics, topic.id],
      excludedSubtopics: [...otherExcluded, ...keys.filter((key) => !next.includes(key))],
    });
  }

  return (
    <>
      <div className={styles.head}>
        <span>
          Выбрано{" "}
          <b>
            {onKeys.length} из {keys.length}
          </b>
        </span>
        <button type="button" className={styles.toggleAll} onClick={() => select(onKeys.length === keys.length ? [] : keys)}>
          {onKeys.length === keys.length ? "Снять все" : "Выбрать все"}
        </button>
      </div>
      <ChipGroup>
        {topic.subtopics.map((sub) => {
          const key = getSubtopicKey(topic.id, sub.id);
          return (
            <Chip
              key={key}
              label={sub.title}
              count={source.filter((q) => q.topic === topic.id && q.subtopic === sub.id).length}
              on={isOn(key)}
              onClick={() => select(isOn(key) ? onKeys.filter((k) => k !== key) : [...onKeys, key])}
            />
          );
        })}
      </ChipGroup>
    </>
  );
}
