import { useState } from "react";
import type { Question } from "../../data/types";
import { Button } from "../../shared/ui/Button";
import { Sheet } from "../../shared/ui/Sheet";
import styles from "./NoteSheet.module.css";
import { useNotes } from "./NotesProvider";

interface NoteSheetProps {
  question: Question | null;
  onClose: () => void;
}

/** Панель редактирования заметки к вопросу. Открыта, пока question не null. */
export function NoteSheet({ question, onClose }: NoteSheetProps) {
  const { getNote } = useNotes();
  const hasNote = !!question && !!getNote(question.id);

  return (
    <Sheet open={!!question} title={hasNote ? "Заметка к вопросу" : "Новая заметка"} onClose={onClose}>
      {question && <NoteEditor question={question} onDone={onClose} />}
    </Sheet>
  );
}

function NoteEditor({ question, onDone }: { question: Question; onDone: () => void }) {
  const { getNote, saveNote, deleteNote } = useNotes();
  const note = getNote(question.id);
  const [text, setText] = useState(note?.text ?? "");

  function save() {
    saveNote(question, text);
    onDone();
  }

  return (
    <div className={styles.editor}>
      <textarea
        className={styles.textarea}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) save();
        }}
        placeholder="Что важно запомнить? Например: «микрозадачи выполняются все разом до следующей задачи»"
        rows={6}
        autoFocus
      />
      <p className={styles.hint}>Заметка хранится только на этом устройстве. Пустая заметка удаляется.</p>
      <div className={styles.actions}>
        {note && (
          <Button
            variant="secondary"
            icon="trash"
            onClick={() => {
              deleteNote(note.key);
              onDone();
            }}
          >
            Удалить
          </Button>
        )}
        <Button icon="check" onClick={save}>
          Сохранить
        </Button>
      </div>
    </div>
  );
}
