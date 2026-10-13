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

/** Запись ленты ответов основной базы. */
export const answerRecord = (questionId, at, correct) => ({ setId: "builtin", questionId, at, correct });

/**
 * Кладёт записи прямо в ленту ответов на устройстве — порядок вопросов в сессии на них не влияет.
 * Приложение уже должно быть открыто (оно создаёт хранилище); прочитает записи после перезагрузки.
 */
export function seedAnswers(page, records) {
  return page.evaluate(
    (list) =>
      new Promise((resolve, reject) => {
        const open = indexedDB.open("frontend-quiz-progress");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const tx = open.result.transaction("answers", "readwrite");
          list.forEach((record, i) => tx.objectStore("answers").put(record, `seed-${record.at}-${i}`));
          tx.oncomplete = () => resolve(undefined);
          tx.onerror = () => reject(tx.error);
        };
      }),
    records,
  );
}

/** Открывает кабинет с главной. */
export async function openCabinet(page, url) {
  await page.goto(url);
  await page.getByText("Что тренируем?").waitFor();
  await page.getByRole("button", { name: "Кабинет" }).click();
  await page.getByRole("heading", { name: "Кабинет" }).waitFor();
}

/** Экран «Настройка тренировки» — со сводки «Тренировка» на главной, экране устных или набора. */
export async function openSettings(page) {
  await page.getByRole("button", { name: /^Тренировка/ }).click();
  await page.getByRole("heading", { name: "Настройка тренировки" }).waitFor();
}

/** Длина сессии выбирается на экране настройки: открыть, выбрать, вернуться назад. */
export async function chooseLength(page, label) {
  await openSettings(page);
  await page.getByRole("button", { name: label, exact: true }).click();
  await page.getByRole("button", { name: "Назад" }).click();
  await page.getByRole("button", { name: /^Тренировка/ }).waitFor();
}
