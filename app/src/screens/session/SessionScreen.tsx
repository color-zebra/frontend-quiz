import clsx from "clsx";
import { useEffect, useState } from "react";
import { getIsMultiple, getIsSpeech } from "../../data/answers";
import type { Question, QuestionBank } from "../../data/types";
import { ComplaintButton, ComplaintSheet } from "../../features/complaint/ComplaintSheet";
import { NoteSheet } from "../../features/notes/NoteSheet";
import { useNotes } from "../../features/notes/NotesProvider";
import { getCurrentQuestion, getIsLastQuestion, type Session, type SpeechGrade } from "../../features/session/session";
import { Button, IconButton } from "../../shared/ui/Button";
import glass from "../../shared/ui/glass.module.css";
import { ActionBar, Screen, TopBar } from "../../shared/ui/Screen";
import { QuestionView } from "../question/QuestionView";
import styles from "./SessionScreen.module.css";

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
}

/** Кнопки и клавиши самооценки устного ответа. */
const GRADES: { grade: SpeechGrade; label: string; key: string }[] = [
  { grade: "didnt", label: "Не знал", key: "1" },
  { grade: "partly", label: "Частично", key: "2" },
  { grade: "knew", label: "Знал", key: "3" },
];

export function SessionScreen({ bank, session, onSelect, onSubmit, onGiveUp, onGrade, onNext, onExit }: SessionScreenProps) {
  const { getNote } = useNotes();
  const [noteOpen, setNoteOpen] = useState(false);
  const [complaintOpen, setComplaintOpen] = useState(false);
  // У устного вопроса эталон открывают кнопкой; запоминаем, у какого по счёту вопроса он открыт.
  const [revealedIndex, setRevealedIndex] = useState(-1);
  const question = getCurrentQuestion(bank, session);
  const speech = !!question && getIsSpeech(question);
  const revealed = speech && revealedIndex === session.index;
  const multiple = !!question && !speech && getIsMultiple(question);
  const isLast = getIsLastQuestion(session);

  // Клавиатура на ноутбуке.
  // Тестовый вопрос: цифры — выбрать (отметить) вариант, 0 — «Не знаю», Enter или → — ответить или дальше.
  // Устный: Enter или пробел — показать эталон, затем 1 / 2 / 3 — не знал / частично / знал.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!question || e.ctrlKey || e.metaKey || e.altKey) return;
      if (document.querySelector("dialog[open]")) return;
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea")) return;

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
  }, [question, speech, revealed, multiple, session.index, session.answered, session.optionOrder, onSelect, onSubmit, onGiveUp, onGrade, onNext]);

  if (!question) return null;

  const correctCount = session.answers.filter((a) => a.correct).length;
  const number = session.index + 1;
  const hasNote = !!getNote(bank.setId, question.id);

  return (
    <Screen>
      <TopBar>
        <IconButton icon="close" label="Выйти из сессии" onClick={onExit} />
        <div className={styles.progressBox}>
          <span className={styles.count}>
            {session.infinite ? `Вопрос ${number} · верно ${correctCount}` : `${number} / ${session.queue.length}`}
          </span>
          {!session.infinite && (
            <div className={styles.track}>
              <span style={{ width: `${(session.answers.length / session.queue.length) * 100}%` }} />
            </div>
          )}
        </div>
        <div className={clsx(styles.tools, glass.glass)}>
          <ComplaintButton bare onClick={() => setComplaintOpen(true)} />
          <span className={styles.toolsDivider} />
          <IconButton
            icon="pencil"
            label={hasNote ? "Изменить заметку" : "Заметка"}
            marked={hasNote}
            bare
            onClick={() => setNoteOpen(true)}
          />
        </div>
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
        onSelect={(optionIndex) => onSelect(question, optionIndex)}
      />

      <ActionBar>{speech ? renderSpeechActions() : renderTestActions()}</ActionBar>

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

  function renderTestActions() {
    if (session.answered) {
      return (
        <Button iconAfter={isLast ? undefined : "arrowRight"} onClick={onNext}>
          {isLast ? "Завершить" : "Дальше"}
        </Button>
      );
    }
    return (
      <>
        <Button variant="secondary" onClick={() => onGiveUp(question!)}>
          Не знаю
        </Button>
        {multiple && (
          <Button icon="check" disabled={session.selected.length === 0} onClick={() => onSubmit(question!)}>
            Ответить
          </Button>
        )}
      </>
    );
  }
}
