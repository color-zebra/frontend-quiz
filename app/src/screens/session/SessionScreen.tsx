import clsx from "clsx";
import { useEffect, useState } from "react";
import { getIsMultiple } from "../../data/answers";
import type { Question, QuestionBank } from "../../data/types";
import { NoteSheet } from "../../features/notes/NoteSheet";
import { useNotes } from "../../features/notes/NotesProvider";
import { getCurrentQuestion, getIsLastQuestion, type Session } from "../../features/session/session";
import { Button, IconButton } from "../../shared/ui/Button";
import { ActionBar, Screen, TopBar } from "../../shared/ui/Screen";
import { QuestionView } from "../question/QuestionView";
import styles from "./SessionScreen.module.css";

interface SessionScreenProps {
  bank: QuestionBank;
  session: Session;
  onSelect: (question: Question, optionIndex: number) => void;
  onSubmit: (question: Question) => void;
  onNext: () => void;
  onExit: () => void;
}

export function SessionScreen({ bank, session, onSelect, onSubmit, onNext, onExit }: SessionScreenProps) {
  const { getNote } = useNotes();
  const [noteOpen, setNoteOpen] = useState(false);
  const question = getCurrentQuestion(bank, session);
  const multiple = !!question && getIsMultiple(question);
  const isLast = getIsLastQuestion(session);
  // В вопросе с галочками до ответа главная кнопка — «Ответить».
  const waitingForSubmit = multiple && !session.answered;

  // Клавиатура на ноутбуке: цифры — выбрать вариант (в вопросе с галочками — отметить), Enter или → — ответить или дальше.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!question || e.ctrlKey || e.metaKey || e.altKey) return;
      if (document.querySelector("dialog[open]")) return;
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea")) return;

      const position = Number(e.key);
      const isProceed = e.key === "Enter" || e.key === "ArrowRight";
      if (!session.answered && Number.isInteger(position) && position >= 1 && position <= session.optionOrder.length) {
        e.preventDefault();
        onSelect(question, session.optionOrder[position - 1]);
      } else if (isProceed && waitingForSubmit) {
        e.preventDefault();
        onSubmit(question);
      } else if (isProceed && session.answered) {
        e.preventDefault();
        onNext();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [question, session.answered, session.optionOrder, waitingForSubmit, onSelect, onSubmit, onNext]);

  if (!question) return null;

  const correctCount = session.answers.filter((a) => a.correct).length;
  const number = session.index + 1;

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
        <span className={styles.spacer} />
      </TopBar>

      <QuestionView
        key={`${session.index}`}
        bank={bank}
        question={question}
        optionOrder={session.optionOrder}
        selected={session.selected}
        answered={session.answered}
        onSelect={(optionIndex) => onSelect(question, optionIndex)}
        onEditNote={() => setNoteOpen(true)}
      />

      <ActionBar>
        <Button
          variant="secondary"
          icon="pencil"
          className={clsx(getNote(bank.setId, question.id) && styles.hasNote)}
          onClick={() => setNoteOpen(true)}
        >
          Заметка
        </Button>
        {waitingForSubmit ? (
          <Button icon="check" disabled={session.selected.length === 0} onClick={() => onSubmit(question)}>
            Ответить
          </Button>
        ) : (
          <Button iconAfter={isLast ? undefined : "arrowRight"} disabled={!session.answered} onClick={onNext}>
            {isLast ? "Завершить" : "Дальше"}
          </Button>
        )}
      </ActionBar>

      <NoteSheet bank={bank} question={noteOpen ? question : null} onClose={() => setNoteOpen(false)} />
    </Screen>
  );
}
