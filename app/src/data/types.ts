/** Метка основной базы. У своих наборов метка своя, по ней различаются заметки и фильтры. */
export const BUILTIN_SET_ID = "builtin";

/** Тема или подтема для вопросов своего набора, у которых они не указаны. */
export const UNGROUPED = "Все вопросы";

export type Level = "junior" | "middle" | "senior";

export const LEVELS: readonly Level[] = ["junior", "middle", "senior"];

export type CodeLang = "html" | "css" | "scss" | "js" | "ts" | "jsx" | "tsx" | "http" | "json" | "text";

export const CODE_LANGS: readonly CodeLang[] = ["html", "css", "scss", "js", "ts", "jsx", "tsx", "http", "json", "text"];

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
  /** Галочки «выберите все подходящие» даже при одном правильном варианте. */
  multiple?: boolean;
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
  /** Название — есть у своих наборов, у основной базы нет. */
  title?: string;
  /** Время сборки базы, ISO-строка. */
  generatedAt?: string;
  topics: Topic[];
  questions: Question[];
}

export interface QuestionBank extends QuestionsFile {
  /** Чья это база: BUILTIN_SET_ID или id своего набора. */
  setId: string;
  byId: Map<string, Question>;
  topicById: Map<string, Topic>;
}
