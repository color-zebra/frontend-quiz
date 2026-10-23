import clsx from "clsx";
import { useEffect, useState } from "react";
import { getHasExplanation, getIsAnswerCorrect, getIsMultiple, getIsSpeech } from "../../data/answers";
import type { Question, QuestionBank } from "../../data/types";
import { ComplaintButton, ComplaintSheet } from "../../features/complaint/ComplaintSheet";
import { NoteSheet } from "../../features/notes/NoteSheet";
import { useNotes } from "../../features/notes/NotesProvider";
import { useSetUrl } from "../../features/sets/SetsProvider";
import { getCurrentQuestion, getIsLastQuestion, type Session, type SpeechGrade } from "../../features/session/session";
import { Button, IconButton } from "../../shared/ui/Button";
import { Icon } from "../../shared/ui/Icon";
import { Markdown } from "../../shared/ui/Markdown";
import { ActionBar, Screen, TopBar } from "../../shared/ui/Screen";
import { BookmarkButton, ToolsCapsule } from "../question/QuestionTools";
import { QuestionView } from "../question/QuestionView";
import { useIsOnScreen, WhyButton } from "../question/WhyButton";
import styles from "./SessionScreen.module.css";
import { useIsDesktop } from "../../shared/ui/useIsDesktop";

interface SessionScreenProps {
  bank: QuestionBank;
  session: Session;
  onSelect: (question: Question, optionIndex: number) => void;
  onSubmit: (question: Question) => void;
  onGiveUp: (question: Question) => void;
  /** Самооценка устного вопроса: сразу переход дальше. */
  onGrade: (question: Question, grade: SpeechGrade) => void;
  onNext: () => void;
  onExit: () => void;
  /** Вопросы урока в режиме обучения: ответы никуда не записываются, крестик возвращает к уроку. */
  learning?: boolean;
}

/** Кнопки и клавиши самооценки устного ответа. */
const GRADES: { grade: SpeechGrade; label: string; key: string }[] = [
  { grade: "didnt", label: "Не знал", key: "1" },
  { grade: "partly", label: "Частично", key: "2" },
  { grade: "knew", label: "Знал", key: "3" },
];

export function SessionScreen({
  bank,
  session,
  onSelect,
  onSubmit,
  onGiveUp,
  onGrade,
  onNext,
  onExit,
  learning = false,
}: SessionScreenProps) {
  const { getNote } = useNotes();
  const baseUrl = useSetUrl(bank.setId);
  const [noteOpen, setNoteOpen] = useState(false);
  const [complaintOpen, setComplaintOpen] = useState(false);
  // У устного вопроса эталон открывают кнопкой; запоминаем, у какого по счёту вопроса он открыт.
  const [revealedIndex, setRevealedIndex] = useState(-1);
  const question = getCurrentQuestion(bank, session);
  const speech = !!question && getIsSpeech(question);
  const revealed = speech && revealedIndex === session.index;
  const multiple = !!question && !speech && getIsMultiple(question);
  const isLast = getIsLastQuestion(session);
  const [explanationRef, explanationOnScreen] = useIsOnScreen();
  const desktop = useIsDesktop();

  // Клавиатура на ноутбуке.
  // Тестовый вопрос: цифры — выбрать (отметить) вариант, 0 — «Не знаю», Enter или → — ответить или дальше.
  // Устный: Enter или пробел — показать эталон, затем 1 / 2 / 3 — не знал / частично / знал.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!question || e.ctrlKey || e.metaKey || e.altKey) return;
      if (document.querySelector("dialog[open]")) return;
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea")) return;

      // Esc — завершить сессию (на десктопе меню нет, выход — эта клавиша или кнопка «Завершить»).
      if (e.key === "Escape") {
        e.preventDefault();
        onExit();
        return;
      }

      const isProceed = e.key === "Enter" || e.key === "ArrowRight";
      if (speech) {
        const grade = GRADES.find((g) => g.key === e.key);
        if (!revealed && (isProceed || e.key === " ")) {
          e.preventDefault();
          setRevealedIndex(session.index);
        } else if (revealed && grade) {
          e.preventDefault();
          onGrade(question, grade.grade);
        }
        return;
      }

      const position = Number(e.key);
      if (!session.answered && e.key === "0") {
        e.preventDefault();
        onGiveUp(question);
      } else if (!session.answered && Number.isInteger(position) && position >= 1 && position <= session.optionOrder.length) {
        e.preventDefault();
        onSelect(question, session.optionOrder[position - 1]);
      } else if (isProceed && multiple && !session.answered) {
        e.preventDefault();
        onSubmit(question);
      } else if (isProceed && session.answered) {
        e.preventDefault();
        onNext();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [question, speech, revealed, multiple, session.index, session.answered, session.optionOrder, onSelect, onSubmit, onGiveUp, onGrade, onNext, onExit]);

  if (!question) return null;

  const correctCount = session.answers.filter((a) => a.correct).length;
  const number = session.index + 1;
  const hasNote = !!getNote(bank.setId, question.id);
  // Клавиши вариантов — по их числу: «1–4», «1–5».
  const keyRange = `1–${session.optionOrder.length}`;
  // Пояснение внизу легко не заметить — после ответа над панелью кнопка «Почему?», пока само пояснение не на экране.
  const showWhy = !speech && session.answered && getHasExplanation(question) && !explanationOnScreen;

  return (
    <Screen width="wide" className={styles.screen}>
      <TopBar>
        {desktop ? (
          <Button variant="secondary" icon="close" className={styles.exit} onClick={onExit}>
            {learning ? "К уроку" : "Завершить"}
          </Button>
        ) : (
          <IconButton icon="close" label={learning ? "Вернуться к уроку" : "Выйти из сессии"} onClick={onExit} />
        )}
        <div className={styles.progressBox}>
          {session.infinite ? (
            // Две строки всегда: в одну «Вопрос 1000 · верно 799» рядом с капсулой не влезает.
            <span className={clsx(styles.count, styles.countInfinite)}>
              <span>Вопрос {number}</span>
              <span className={styles.countCorrect}>верно {correctCount}</span>
            </span>
          ) : (
            <span className={styles.count}>
              {number} / {session.queue.length}
            </span>
          )}
          {!session.infinite &&
            (desktop ? (
              // Дорожка сессии: отрезок на каждый вопрос — верно, ошибка, текущий, впереди.
              <div className={styles.strip} aria-hidden="true">
                {session.queue.map((id, i) => {
                  const answer = session.answers[i];
                  return (
                    <i
                      key={`${i}-${id}`}
                      className={clsx(answer && (answer.correct ? styles.stripOk : styles.stripBad), i === session.index && styles.stripNow)}
                    />
                  );
                })}
              </div>
            ) : (
              <div className={styles.track}>
                <span style={{ width: `${(session.answers.length / session.queue.length) * 100}%` }} />
              </div>
            ))}
        </div>
        <ToolsCapsule>
          <ComplaintButton bare onClick={() => setComplaintOpen(true)} />
          <BookmarkButton setId={bank.setId} questionId={question.id} />
          <IconButton
            icon="pencil"
            label={hasNote ? "Изменить заметку" : "Заметка"}
            marked={hasNote}
            bare
            onClick={() => setNoteOpen(true)}
          />
        </ToolsCapsule>
      </TopBar>

      <QuestionView
        key={`${session.index}`}
        bank={bank}
        question={question}
        optionOrder={session.optionOrder}
        selected={session.selected}
        answered={session.answered}
        reveal={session.gaveUp || revealed}
        gaveUp={session.gaveUp}
        learning={learning}
        explanationRef={explanationRef}
        onSelect={(optionIndex) => onSelect(question, optionIndex)}
      />

      <ActionBar
        even={!speech}
        className={clsx(desktop && !speech && styles.deskBar)}
        dockClassName={styles.dock}
        aside={showWhy && <WhyButton question={question} baseUrl={baseUrl} />}
      >
        {speech ? renderSpeechActions() : renderTestActions()}
      </ActionBar>

      <NoteSheet bank={bank} question={noteOpen ? question : null} onClose={() => setNoteOpen(false)} />
      <ComplaintSheet bank={bank} question={complaintOpen ? question : null} onClose={() => setComplaintOpen(false)} />
    </Screen>
  );

  function renderSpeechActions() {
    if (!revealed) {
      return (
        <Button icon="speech" onClick={() => setRevealedIndex(session.index)}>
          Показать ответ
        </Button>
      );
    }
    return GRADES.map(({ grade, label }) => (
      <Button
        key={grade}
        className={styles.grade}
        variant={grade === "knew" ? "primary" : "secondary"}
        onClick={() => onGrade(question!, grade)}
      >
        {label}
      </Button>
    ));
  }

  // Справа всегда кнопка одного размера и на одном месте: «Не знаю» или «Ответить» до ответа, «Дальше» после.
  function renderTestActions() {
    if (session.answered) {
      return (
        <>
          <AnswerVerdict question={question!} session={session} large={desktop} />
          {desktop && <KeyHints keys={[[keyRange, "вариант"], ["Enter", "дальше"], ["Esc", "завершить"]]} />}
          <Button iconAfter={isLast ? undefined : "arrowRight"} onClick={onNext}>
            {isLast ? "Завершить" : "Дальше"}
          </Button>
        </>
      );
    }
    const giveUp = (
      <Button variant="secondary" onClick={() => onGiveUp(question!)}>
        Не знаю
      </Button>
    );
    if (!multiple) {
      return (
        <>
          <span className={styles.placeholder}>Выбери вариант</span>
          {desktop && <KeyHints keys={[[keyRange, "вариант"], ["0", "не знаю"], ["Esc", "завершить"]]} />}
          {giveUp}
        </>
      );
    }
    return (
      <>
        {giveUp}
        {desktop && <KeyHints keys={[[keyRange, "отметить"], ["Enter", "ответить"], ["0", "не знаю"]]} />}
        <Button icon="check" disabled={session.selected.length === 0} onClick={() => onSubmit(question!)}>
          Ответить
        </Button>
      </>
    );
  }
}

/**
 * Итог ответа в нижней панели, слева от «Дальше». Пояснения под вариантами раздвигают список, и выбранный вариант
 * может уехать из виду, — а панель видна всегда. При ошибке сразу говорит номер правильного варианта.
 */
/** Подсказка клавиш в панели на десктопе: «1–4 вариант · Enter дальше». */
function KeyHints({ keys }: { keys: [string, string][] }) {
  return (
    <span className={styles.keys}>
      {keys.map(([key, label]) => (
        <span key={key}>
          <kbd>{key}</kbd>
          {label}
        </span>
      ))}
    </span>
  );
}

function AnswerVerdict({ question, session, large = false }: { question: Question; session: Session; large?: boolean }) {
  const ok = !session.gaveUp && getIsAnswerCorrect(question, session.selected);
  // Номера правильных вариантов — в том порядке, в каком варианты стоят на экране.
  const numbers = session.optionOrder.flatMap((optionIndex, position) =>
    question.options[optionIndex].correct ? [position + 1] : [],
  );

  // Десктоп: вердикт крупно — кружок, слово и правильный ответ прямо в панели.
  if (large) {
    const correctText = session.optionOrder
      .map((optionIndex) => question.options[optionIndex])
      .filter((o) => o.correct)
      .map((o) => o.text)
      .join("; ");
    return (
      <div className={clsx(styles.bigVerdict, ok ? styles.verdictOk : styles.verdictBad)} role="status">
        <span className={styles.bigIcon}>
          <Icon name={ok ? "check" : "close"} />
        </span>
        <span className={styles.bigText}>
          <b>{getVerdictText(ok, session.gaveUp)}</b>
          {!ok && (
            <span>
              {numbers.length > 1 ? "Верные" : "Правильный ответ"} — {numbers.join(", ")}: <Markdown text={correctText} inline />
            </span>
          )}
        </span>
      </div>
    );
  }

  return (
    <div className={clsx(styles.verdict, ok ? styles.verdictOk : styles.verdictBad)} role="status">
      <b>
        <Icon name={ok ? "check" : "close"} />
        {getVerdictText(ok, session.gaveUp)}
      </b>
      {!ok && <span>{`${numbers.length > 1 ? "верные" : "верный"}: ${numbers.join(", ")}`}</span>}
    </div>
  );
}

// Слова короткие и одни для всех вопросов: на экране в 320px длиннее не влезает. Подробности про вопросы
// с несколькими ответами («нужно все правильные и ни одного лишнего») — в самом вопросе.
function getVerdictText(ok: boolean, gaveUp: boolean) {
  if (gaveUp) return "Не знаю";
  return ok ? "Верно" : "Неверно";
}
