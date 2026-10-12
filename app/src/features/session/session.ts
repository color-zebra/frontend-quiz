import type { Question, QuestionBank } from "../../data/types";
import { shuffle } from "../../shared/lib/random";

export interface SessionAnswer {
  questionId: string;
  correct: boolean;
}

export interface Session {
  infinite: boolean;
  /** Все вопросы сессии. В бесконечном режиме из них перемешивается каждый следующий круг. */
  pool: string[];
  /** Порядок показа. Конечная сессия — фиксированный, бесконечная — растёт кругами. */
  queue: string[];
  index: number;
  /** Порядок вариантов текущего вопроса: индексы в question.options. */
  optionOrder: number[];
  /** Выбранный вариант (индекс в question.options) или null, пока ответа нет. */
  picked: number | null;
  answers: SessionAnswer[];
}

function getOptionOrder(bank: QuestionBank, questionId: string) {
  const count = bank.byId.get(questionId)?.options.length ?? 0;
  return shuffle(Array.from({ length: count }, (_, i) => i));
}

/** length — число вопросов (не больше пула) или "infinite". */
export function startSession(bank: QuestionBank, ids: readonly string[], length: number | "infinite"): Session {
  const infinite = length === "infinite";
  const queue = infinite ? shuffle(ids) : shuffle(ids).slice(0, length);
  return {
    infinite,
    pool: [...ids],
    queue,
    index: 0,
    optionOrder: getOptionOrder(bank, queue[0]),
    picked: null,
    answers: [],
  };
}

export function getCurrentQuestion(bank: QuestionBank, session: Session): Question | undefined {
  return bank.byId.get(session.queue[session.index]);
}

export function pickOption(session: Session, question: Question, optionIndex: number): Session {
  if (session.picked !== null) return session;
  return {
    ...session,
    picked: optionIndex,
    answers: [...session.answers, { questionId: question.id, correct: question.options[optionIndex]?.correct === true }],
  };
}

export function getIsLastQuestion(session: Session) {
  return !session.infinite && session.index >= session.queue.length - 1;
}

/** Следующий круг бесконечного режима: перемешиваем заново, но не начинаем с только что показанного. */
function getNextRound(pool: readonly string[], lastId: string) {
  const round = shuffle(pool);
  if (round.length > 1 && round[0] === lastId) [round[0], round[1]] = [round[1], round[0]];
  return round;
}

export function goToNextQuestion(bank: QuestionBank, session: Session): Session {
  const index = session.index + 1;
  let queue = session.queue;
  if (session.infinite && index >= queue.length) {
    queue = [...queue, ...getNextRound(session.pool, queue[queue.length - 1])];
  }
  return { ...session, queue, index, optionOrder: getOptionOrder(bank, queue[index]), picked: null };
}

/** Id вопросов с ошибкой — без повторов, в порядке первой ошибки. */
export function getMistakeIds(answers: readonly SessionAnswer[]) {
  return [...new Set(answers.filter((a) => !a.correct).map((a) => a.questionId))];
}
