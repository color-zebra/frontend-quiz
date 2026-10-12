import stub from "./stub.json";
import type { QuestionBank, QuestionsFile } from "./types";

/** Имитация сетевой задержки, чтобы состояние «загружается» было видно уже на заглушке. */
const STUB_DELAY_MS = 500;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createBank(file: QuestionsFile, description: string): QuestionBank {
  return {
    ...file,
    description,
    byId: new Map(file.questions.map((q) => [q.id, q])),
    topicById: new Map(file.topics.map((t) => [t.id, t])),
  };
}

/**
 * Загружает базу вопросов. Пока это заглушка из трёх вопросов;
 * на этапе «настоящие данные» здесь появится fetch собранного questions.json с GitHub Pages.
 */
export async function loadQuestions(): Promise<QuestionBank> {
  await wait(STUB_DELAY_MS);
  // В режиме разработки адрес с ?fail показывает экран ошибки загрузки.
  if (import.meta.env.DEV && new URLSearchParams(location.search).has("fail")) {
    throw new Error("Тестовая ошибка загрузки");
  }
  return createBank(stub as QuestionsFile, "тестовые данные");
}
