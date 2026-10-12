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
  /** Варианты ответа. У устного вопроса (type: "speech") их нет — пустой массив. */
  options: Option[];
  /** Устный вопрос: отвечаешь про себя или вслух, потом сверяешься с эталоном и оцениваешь себя сам. */
  type?: "speech";
  /** Эталонный ответ устного вопроса, Markdown. */
  answer?: string;
  /** Ключевые тезисы, которые стоит упомянуть в устном ответе. */
  points?: string[];
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
  /** Тестовые вопросы — с вариантами ответа. */
  questions: Question[];
  /** Устные вопросы — отдельным списком, с ними не смешиваются. */
  speech?: Question[];
}

export interface QuestionBank extends QuestionsFile {
  /** Чья это база: BUILTIN_SET_ID или id своего набора. */
  setId: string;
  /** Устные вопросы (пустой список, если их нет). */
  speech: Question[];
  /** Все вопросы базы по id — и тестовые, и устные: так их находят заметки и разбор. */
  byId: Map<string, Question>;
  topicById: Map<string, Topic>;
}
