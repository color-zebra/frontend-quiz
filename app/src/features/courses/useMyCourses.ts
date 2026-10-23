import type { QuestionBank } from "../../data/types";
import { useLessons } from "../lessons/LessonsProvider";
import { useSets } from "../sets/SetsProvider";
import type { SetRecord } from "../sets/setsStore";
import { getCourseState, type CourseState } from "./courses";

export interface MyCourse {
  record: SetRecord;
  bank: QuestionBank;
  state: CourseState;
  updatedAt: number;
}

/**
 * Мои курсы — добавленные наборы с уроками: из каталога и свои по ссылке («есть уроки — значит курс»). Сначала те,
 * где занимались последними. current — самый свежий начатый и не пройденный курс: его урок в «Продолжить».
 */
export function useMyCourses() {
  const { sets, getSetBank } = useSets();
  const { getCourse } = useLessons();
  const mine: MyCourse[] = sets
    .map((record) => {
      const bank = getSetBank(record.id);
      const state = bank && getCourseState(bank, getCourse(record.id));
      return bank && state ? { record, bank, state, updatedAt: getCourse(record.id)?.updatedAt ?? record.addedAt } : null;
    })
    .filter((c): c is MyCourse => c !== null)
    .sort((a, b) => b.updatedAt - a.updatedAt);
  const current = mine.find((c) => c.state.started && !c.state.finished);
  return { mine, current };
}
