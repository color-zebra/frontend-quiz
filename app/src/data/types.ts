export type Level = "junior" | "middle" | "senior";

export const LEVELS: readonly Level[] = ["junior", "middle", "senior"];

export type CodeLang = "html" | "css" | "scss" | "js" | "ts" | "jsx" | "tsx" | "http" | "json" | "text";

export interface Option {
  text: string;
  why: string;
  correct?: boolean;
}

export interface Question {
  id: string;
  topic: string;
  subtopic: string;
  level: Level;
  tags?: string[];
  question: string;
  code?: string;
  codeLang?: CodeLang;
  options: Option[];
  explanation: string;
  links?: string[];
  source?: string;
}

export interface Subtopic {
  id: string;
  title: string;
}

export interface Topic {
  id: string;
  title: string;
  subtopics: Subtopic[];
}

/** Формат dist/questions.json. */
export interface QuestionsFile {
  /** Время сборки базы, ISO-строка. */
  generatedAt?: string;
  topics: Topic[];
  questions: Question[];
}

export interface QuestionBank extends QuestionsFile {
  byId: Map<string, Question>;
  topicById: Map<string, Topic>;
}
