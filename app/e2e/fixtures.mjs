// Подмена базы на время теста: свои вопросы вместо настоящих, с гарантированным возвратом.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DIST_DIR } from "./lib.mjs";

const QUESTIONS = join(DIST_DIR, "questions.json");

export const option = (text, correct = false) => ({ text, why: `Пояснение к ${text}`, ...(correct ? { correct: true } : {}) });

export function question(id, text, options, extra = {}) {
  return {
    id,
    topic: "javascript",
    subtopic: "event-loop",
    level: "middle",
    question: text,
    options,
    explanation: "Как это устроено: тестовое объяснение.",
    ...extra,
  };
}

export function speechQuestion(id, text, extra = {}) {
  return {
    id,
    type: "speech",
    topic: "javascript",
    subtopic: "event-loop",
    level: "middle",
    question: text,
    options: [],
    answer: `Эталон к «${text}»`,
    points: ["Первый тезис", "Второй тезис"],
    explanation: "",
    ...extra,
  };
}

/** Выполняет fn с подменённой базой и всегда возвращает настоящую. */
export async function withBank({ questions, speech = [] }, fn) {
  const original = readFileSync(QUESTIONS, "utf8");
  const base = JSON.parse(original);
  writeFileSync(QUESTIONS, JSON.stringify({ generatedAt: base.generatedAt, topics: base.topics, questions, speech }));
  try {
    await fn();
  } finally {
    writeFileSync(QUESTIONS, original);
  }
}

/** Файл для загрузки через «Загрузить файл с устройства». */
export const fileInput = (name, text) => ({ name, mimeType: "application/octet-stream", buffer: Buffer.from(text, "utf8") });
