import clsx from "clsx";
import { getTopicTitles } from "../../data/titles";
import type { Question, QuestionBank } from "../../data/types";
import { useNotes } from "../../features/notes/NotesProvider";
import { formatLink } from "../../shared/lib/formatLink";
import glass from "../../shared/ui/glass.module.css";
import { Icon } from "../../shared/ui/Icon";
import { LevelBadge } from "../../shared/ui/LevelBadge";
import { Markdown } from "../../shared/ui/Markdown";
import { CodeBlock } from "../../shared/ui/code/CodeBlock";
import styles from "./QuestionView.module.css";

interface QuestionViewProps {
  bank: QuestionBank;
  question: Question;
  /** Порядок вариантов: индексы в question.options. */
  optionOrder: readonly number[];
  /** Выбранный вариант (индекс в question.options) или null. */
  picked: number | null;
  /** Показать ответ без выбора — режим разбора. */
  reveal?: boolean;
  onPick?: (optionIndex: number) => void;
  onEditNote: () => void;
}

export function QuestionView({ bank, question, optionOrder, picked, reveal = false, onPick, onEditNote }: QuestionViewProps) {
  const { getNote } = useNotes();
  const note = getNote(question.id);
  const answered = reveal || picked !== null;
  const { topicTitle, subtopicTitle } = getTopicTitles(bank, question);

  return (
    <article className={styles.question}>
      <div className={styles.meta}>
        <span className={clsx(styles.pill, glass.glass)}>
          {topicTitle} · {subtopicTitle}
        </span>
        <LevelBadge level={question.level} />
      </div>

      <Markdown text={question.question} className={styles.text} />

      {question.code && <CodeBlock code={question.code} lang={question.codeLang} />}

      <ol className={styles.options}>
        {optionOrder.map((optionIndex, position) => (
          <li key={optionIndex}>
            <OptionCard
              question={question}
              optionIndex={optionIndex}
              number={position + 1}
              answered={answered}
              picked={picked === optionIndex}
              onPick={onPick}
            />
          </li>
        ))}
      </ol>

      {answered && (
        <section className={clsx(styles.explain, glass.glass)}>
          <h2 className={styles.explainTitle}>
            <Icon name="bulb" />
            Как это устроено
          </h2>
          <Markdown text={question.explanation} className={styles.explainText} />
          {question.links && question.links.length > 0 && (
            <div className={styles.links}>
              {question.links.map((url) => (
                <a key={url} href={url} target="_blank" rel="noreferrer">
                  {formatLink(url)} ↗
                </a>
              ))}
              <span className={styles.linksHint}>Ссылки открываются только с интернетом</span>
            </div>
          )}
        </section>
      )}

      {note && (
        <button type="button" className={clsx(styles.note, glass.glass)} onClick={onEditNote}>
          <span className={styles.noteHead}>
            <Icon name="pencil" />
            Моя заметка
          </span>
          <span className={styles.noteText}>{note.text}</span>
        </button>
      )}
    </article>
  );
}

interface OptionCardProps {
  question: Question;
  optionIndex: number;
  number: number;
  answered: boolean;
  picked: boolean;
  onPick?: (optionIndex: number) => void;
}

function OptionCard({ question, optionIndex, number, answered, picked, onPick }: OptionCardProps) {
  const option = question.options[optionIndex];
  const correct = option.correct === true;

  return (
    <button
      type="button"
      className={clsx(
        styles.option,
        glass.glass,
        answered && correct && styles.correct,
        answered && picked && !correct && styles.wrong,
        answered && !correct && !picked && styles.dim,
      )}
      disabled={answered}
      onClick={() => onPick?.(optionIndex)}
    >
      <span className={styles.optionHead}>
        <span className={styles.key}>{number}</span>
        <Markdown text={option.text} inline className={styles.optionText} />
      </span>
      {answered && correct && <span className={styles.status}>{picked ? "Верно" : "Правильный ответ"}</span>}
      {answered && picked && !correct && <span className={styles.status}>Ваш ответ</span>}
      {answered && <Markdown text={option.why} inline className={styles.why} />}
    </button>
  );
}
