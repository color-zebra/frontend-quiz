import clsx from "clsx";
import { useEffect, useState } from "react";
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
  onPick: (question: Question, optionIndex: number) => void;
  onNext: () => void;
  onExit: () => void;
}

export function SessionScreen({ bank, session, onPick, onNext, onExit }: SessionScreenProps) {
  const { getNote } = useNotes();
  const [noteOpen, setNoteOpen] = useState(false);
  const question = getCurrentQuestion(bank, session);
  const answered = session.picked !== null;
  const isLast = getIsLastQuestion(session);

  // Клавиатура на ноутбуке: 1–4 — выбрать вариант, Enter или → — дальше.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!question || e.ctrlKey || e.metaKey || e.altKey) return;
      if (document.querySelector("dialog[open]")) return;
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea")) return;

      const position = Number(e.key);
      if (!answered && Number.isInteger(position) && position >= 1 && position <= session.optionOrder.length) {
        e.preventDefault();
        onPick(question, session.optionOrder[position - 1]);
      } else if (answered && (e.key === "Enter" || e.key === "ArrowRight")) {
        e.preventDefault();
        onNext();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [question, answered, session.optionOrder, onPick, onNext]);

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
        picked={session.picked}
        onPick={(optionIndex) => onPick(question, optionIndex)}
        onEditNote={() => setNoteOpen(true)}
      />

      <ActionBar>
        <Button
          variant="secondary"
          icon="pencil"
          className={clsx(getNote(question.id) && styles.hasNote)}
          onClick={() => setNoteOpen(true)}
        >
          Заметка
        </Button>
        <Button iconAfter={isLast ? undefined : "arrowRight"} disabled={!answered} onClick={onNext}>
          {isLast ? "Завершить" : "Дальше"}
        </Button>
      </ActionBar>

      <NoteSheet question={noteOpen ? question : null} onClose={() => setNoteOpen(false)} />
    </Screen>
  );
}
