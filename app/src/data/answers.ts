import type { Question } from "./types";

/** Устный вопрос — без вариантов, с эталонным ответом. */
export function getIsSpeech(question: Question) {
  return question.type === "speech";
}

/** Вопрос с галочками: несколько правильных вариантов или явный multiple: true. */
export function getIsMultiple(question: Question) {
  return question.multiple === true || question.options.filter((o) => o.correct === true).length > 1;
}

/** Ответ засчитан, только если выбраны все правильные варианты и ни одного лишнего. */
export function getIsAnswerCorrect(question: Question, selected: readonly number[]) {
  const correct = question.options.flatMap((option, index) => (option.correct === true ? [index] : []));
  return selected.length === correct.length && correct.every((index) => selected.includes(index));
}

/** Есть ли разбор «Как это устроено»: в своих наборах его может не быть. */
export function getHasExplanation(question: Question) {
  return question.explanation.trim() !== "" || (question.links?.length ?? 0) > 0;
}
