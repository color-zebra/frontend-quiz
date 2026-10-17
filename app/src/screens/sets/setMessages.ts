import type { SkippedQuestion } from "../../features/sets/parseSet";
import type { SetRecord } from "../../features/sets/setsStore";
import { countQuestions, LESSON_FORMS, plural } from "../../shared/lib/plural";

/** Сообщение о добавлении или обновлении набора: текст и, если есть, отчёт о файле. */
export type Message = { kind: "ok" | "error"; text: string; skipped?: SkippedQuestion[]; warnings?: string[] };

/** Что приложение сказало о файле набора: пропущенные вопросы и замечания. */
interface FileReport {
  skipped: readonly SkippedQuestion[];
  warnings: readonly string[];
}

export function getErrorText(error: unknown) {
  return error instanceof Error ? error.message : "Неизвестная ошибка";
}

/** Вопросов в наборе: тестовый набор — тестовые, устный — устные. */
export function getQuestionCount(record: SetRecord) {
  return record.file.questions.length + (record.file.speech?.length ?? 0);
}

/** «53 вопроса» или «12 вопросов, 4 урока» — автор набора сразу видит, что уроки прочитались. */
export function describeSetContents(record: SetRecord) {
  const lessons = record.file.lessons?.length ?? 0;
  const questions = countQuestions(getQuestionCount(record));
  return lessons ? `${questions}, ${lessons} ${plural(lessons, LESSON_FORMS)}` : questions;
}

export function getReportText({ skipped, warnings }: FileReport) {
  if (skipped.length && warnings.length) return ` Пропущено ${skipped.length}, есть замечания к файлу — подробности ниже.`;
  if (skipped.length) return ` Пропущено ${skipped.length} — причины ниже.`;
  if (warnings.length) return " Есть замечания к файлу — подробности ниже.";
  return "";
}

/** Подробности для сообщения: какие вопросы набора пропущены и почему, что поправить в файле. */
export function getReportDetails(message: Message) {
  const skipped = message.skipped ?? [];
  const warnings = message.warnings ?? [];
  if (!skipped.length && !warnings.length) return undefined;
  const title = !warnings.length ? "Что пропущено" : skipped.length ? "Что пропущено и что поправить" : "Что поправить в файле";
  return { title, items: [...skipped.map((s) => `${s.label}: ${s.reason}`), ...warnings] };
}
