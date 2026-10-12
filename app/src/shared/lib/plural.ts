/** Русское склонение по числу: plural(5, ["вопрос", "вопроса", "вопросов"]) → "вопросов". */
export function plural(n: number, forms: readonly [string, string, string]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

export const QUESTION_FORMS = ["вопрос", "вопроса", "вопросов"] as const;
export const NOTE_FORMS = ["заметка", "заметки", "заметок"] as const;
export const ANSWER_FORMS = ["ответа", "ответов", "ответов"] as const;

export function countQuestions(n: number) {
  return `${n} ${plural(n, QUESTION_FORMS)}`;
}
