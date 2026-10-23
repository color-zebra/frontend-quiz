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
  /** Строка в файле основной базы, где записан вопрос: кнопка «Не согласен» открывает GitHub прямо на ней. */
  line?: number;
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

/** Урок режима обучения: связный текст, который читают до вопросов, и вопросы, которые его закрепляют. */
export interface Lesson {
  /** Постоянный id: к нему привязаны отметка «освоен» и место, где человек остановился. */
  id: string;
  title: string;
  /** Раздел оглавления; подряд идущие уроки с одним разделом — одна группа. */
  topic?: string;
  /** Подтема, из которой урок взял вопросы, если их список не задан явно. */
  subtopic?: string;
  /** Текст урока — Markdown с таблицами, картинками и блоками кода. */
  body: string;
  /** Тестовые вопросы после урока, в порядке показа. Пусто — после урока сразу следующий. */
  questionIds: string[];
  /** Озвучка урока — полная https-ссылка на аудиофайл (относительный путь из файла уже разрешён от ссылки набора). */
  audio?: string;
  /** В уроке есть практика за компьютером: демо-страница, DevTools. Ставит автор курса (computer: true). */
  computer?: boolean;
}

/**
 * Значки курса, которые ставит его автор: audio — «Озвучен», computer — «Практика за компьютером».
 * Приложение их не проверяет — это слово автора.
 */
export type CourseFeature = "audio" | "computer";
export const COURSE_FEATURES: readonly CourseFeature[] = ["audio", "computer"];

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
  /** Уроки режима обучения, в порядке изучения. Бывают только у тестовых наборов. */
  lessons?: Lesson[];
  /** Значки курса (features в файле набора). */
  features?: CourseFeature[];
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
