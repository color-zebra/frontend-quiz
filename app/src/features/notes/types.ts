import { LEVELS, type Level } from "../../data/types";

export interface Note {
  /** `${setId}:${questionId}` — так заметки к разным наборам не путаются даже при одинаковых id. */
  key: string;
  setId: string;
  questionId: string;
  text: string;
  updatedAt: number;
  /** Копия вопроса на момент записи: если вопрос удалят из базы, заметка останется понятной. */
  snapshot: {
    question: string;
    topicTitle: string;
    subtopicTitle: string;
    level: Level;
    /** Название своего набора — чтобы заметка оставалась понятной и после удаления набора. */
    setTitle?: string;
  };
}

export function getNoteKey(setId: string, questionId: string) {
  return `${setId}:${questionId}`;
}

export function isNote(value: unknown): value is Note {
  if (!value || typeof value !== "object") return false;
  const n = value as Record<string, unknown>;
  const s = n.snapshot as Record<string, unknown> | undefined;
  return (
    typeof n.key === "string" &&
    typeof n.setId === "string" &&
    typeof n.questionId === "string" &&
    typeof n.text === "string" &&
    typeof n.updatedAt === "number" &&
    n.key === getNoteKey(n.setId, n.questionId) &&
    !!s &&
    typeof s.question === "string" &&
    typeof s.topicTitle === "string" &&
    typeof s.subtopicTitle === "string" &&
    LEVELS.includes(s.level as Level)
  );
}
