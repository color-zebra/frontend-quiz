import clsx from "clsx";
import { useLayoutEffect, useRef, type Ref, type RefObject } from "react";
import { getHasExplanation, getIsAnswerCorrect, getIsMultiple, getIsSpeech } from "../../data/answers";
import { formatTopicLine, getTopicTitles } from "../../data/titles";
import type { Question, QuestionBank } from "../../data/types";
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
  /** Выбранные варианты (индексы в question.options). */
  selected: readonly number[];
  /** Ответ дан — показать разбор. */
  answered: boolean;
  /** Показать ответ без выбора — режим разбора. */
  reveal?: boolean;
  /** Ответ открыт кнопкой «Не знаю». */
  gaveUp?: boolean;
  /** Блок «Как это устроено» — по нему экран понимает, видно ли пояснение и нужна ли кнопка «Почему?». */
  explanationRef?: Ref<HTMLElement>;
  onSelect?: (optionIndex: number) => void;
}

export function QuestionView({
  bank,
  question,
  optionOrder,
  selected,
  answered,
  reveal = false,
  gaveUp = false,
  explanationRef,
  onSelect,
}: QuestionViewProps) {
  const multiple = getIsMultiple(question);
  const speech = getIsSpeech(question);
  const showResult = reveal || answered;
  const hasExplanation = getHasExplanation(question);
  const { topicTitle, subtopicTitle } = getTopicTitles(bank, question);
  const optionsRef = useRef<HTMLOListElement>(null);
  useKeepAnswerInPlace(optionsRef, showResult, selected[0]);

  return (
    <article className={styles.question}>
      <div className={styles.meta}>
        <span className={clsx(styles.pill, glass.glass)}>
          {formatTopicLine(topicTitle, subtopicTitle)}
        </span>
        <LevelBadge level={question.level} />
      </div>

      <Markdown text={question.question} className={styles.text} />

      {question.code && <CodeBlock code={question.code} lang={question.codeLang} />}

      {multiple && !showResult && <p className={styles.hint}>Выберите все подходящие варианты</p>}
      {gaveUp && (
        <p className={clsx(styles.verdict, styles.verdictBad)} role="status">
          Ответ показан — вопрос попадёт в «Прорешать ошибки»
        </p>
      )}
      {multiple && answered && !reveal && <MultipleVerdict correct={getIsAnswerCorrect(question, selected)} />}

      {speech && !showResult && <p className={styles.hint}>Ответь про себя или вслух, потом открой эталон</p>}
      {speech && showResult && <SpeechAnswer question={question} />}

      <ol ref={optionsRef} className={styles.options} hidden={speech}>
        {optionOrder.map((optionIndex, position) => (
          <li key={optionIndex}>
            <OptionCard
              question={question}
              optionIndex={optionIndex}
              number={position + 1}
              multiple={multiple}
              showResult={showResult}
              reveal={reveal}
              selected={selected.includes(optionIndex)}
              onSelect={onSelect}
            />
          </li>
        ))}
      </ol>

      {showResult && hasExplanation && (
        <section ref={explanationRef} className={clsx(styles.explain, glass.glass)}>
          <h2 className={styles.explainTitle}>
            <Icon name="bulb" className={styles.bulb} />
            Как это устроено
          </h2>
          <ExplanationBody question={question} />
        </section>
      )}

    </article>
  );
}

/**
 * После ответа под каждым вариантом раскрывается пояснение, и список раздвигается: выбранный вариант уезжал вниз,
 * а под палец приезжал другой. Пока ответа нет, запоминаем, где стоит каждый вариант, а после ответа подкручиваем
 * страницу так, чтобы выбранный остался на том же месте экрана. Срабатывает до отрисовки — прыжка не видно.
 */
function useKeepAnswerInPlace(
  listRef: RefObject<HTMLOListElement | null>,
  showResult: boolean,
  anchorIndex: number | undefined,
) {
  // Позиция варианта от начала страницы: от прокрутки она не меняется, в отличие от позиции на экране.
  const offsets = useRef(new Map<number, number>());

  useLayoutEffect(() => {
    const items = [...(listRef.current?.querySelectorAll<HTMLElement>("[data-option]") ?? [])];
    const getOffset = (el: HTMLElement) => el.getBoundingClientRect().top + window.scrollY;
    if (!showResult) {
      offsets.current = new Map(items.map((el) => [Number(el.dataset.option), getOffset(el)]));
      return;
    }
    const before = anchorIndex === undefined ? undefined : offsets.current.get(anchorIndex);
    const anchor = items.find((el) => Number(el.dataset.option) === anchorIndex);
    offsets.current.clear();
    if (before === undefined || !anchor) return;
    const shift = getOffset(anchor) - before;
    // У короткого вопроса внизу может не хватить места, чтобы подкрутить, — добавляем его под этим вопросом.
    const room = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
    const article = anchor.closest("article");
    if (shift > room && article) article.style.paddingBottom = `${shift - room}px`;
    window.scrollBy(0, shift);
  });
}

/** Текст разбора «Как это устроено» и ссылки — под вопросом и в шторке «Почему?». */
export function ExplanationBody({ question }: { question: Question }) {
  return (
    <>
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
    </>
  );
}

/** Эталонный ответ устного вопроса и тезисы, с которыми стоит сверить свой ответ. */
function SpeechAnswer({ question }: { question: Question }) {
  return (
    <section className={clsx(styles.explain, styles.answer, glass.glass)}>
      <h2 className={styles.explainTitle}>
        <Icon name="check" />
        Эталонный ответ
      </h2>
      {question.answer && <Markdown text={question.answer} className={styles.explainText} />}
      {question.points && question.points.length > 0 && (
        <>
          <h3 className={styles.pointsTitle}>Что стоит упомянуть</h3>
          <ul className={styles.points}>
            {question.points.map((point) => (
              <li key={point}>
                <Markdown text={point} inline />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function MultipleVerdict({ correct }: { correct: boolean }) {
  return (
    <p className={clsx(styles.verdict, correct ? styles.verdictOk : styles.verdictBad)} role="status">
      {correct ? "Ответ засчитан" : "Ответ не засчитан: нужно выбрать все правильные варианты и ни одного лишнего"}
    </p>
  );
}

interface OptionCardProps {
  question: Question;
  optionIndex: number;
  number: number;
  multiple: boolean;
  /** Показать разбор: ответ дан или режим разбора. */
  showResult: boolean;
  /** Режим разбора: выбора не было. */
  reveal: boolean;
  selected: boolean;
  onSelect?: (optionIndex: number) => void;
}

/** Пометка варианта после ответа. В режиме разбора выбора не было — отмечаем только правильные. */
function getStatus(correct: boolean, selected: boolean, multiple: boolean, reveal: boolean) {
  if (reveal) return correct ? "Правильный ответ" : null;
  if (correct && selected) return "Верно";
  if (correct) return multiple ? "Пропущен" : "Правильный ответ";
  if (selected) return multiple ? "Лишний" : "Ваш ответ";
  return null;
}

function OptionCard({ question, optionIndex, number, multiple, showResult, reveal, selected, onSelect }: OptionCardProps) {
  const option = question.options[optionIndex];
  const correct = option.correct === true;
  const status = showResult ? getStatus(correct, selected, multiple, reveal) : null;

  return (
    <button
      type="button"
      className={clsx(
        styles.option,
        glass.glass,
        !showResult && multiple && selected && styles.checked,
        showResult && correct && (selected || reveal || !multiple) && styles.correct,
        showResult && correct && !selected && !reveal && multiple && styles.missed,
        showResult && selected && !correct && styles.wrong,
        showResult && !correct && !selected && styles.dim,
      )}
      disabled={showResult}
      aria-pressed={multiple && !showResult ? selected : undefined}
      data-option={optionIndex}
      onClick={() => onSelect?.(optionIndex)}
    >
      <span className={styles.optionHead}>
        <span className={clsx(styles.key, multiple && styles.checkbox)}>
          {multiple && !showResult && selected ? <Icon name="check" /> : number}
        </span>
        <Markdown text={option.text} inline className={styles.optionText} />
      </span>
      {status && <span className={styles.status}>{status}</span>}
      {showResult && <Markdown text={option.why} inline className={styles.why} />}
    </button>
  );
}
