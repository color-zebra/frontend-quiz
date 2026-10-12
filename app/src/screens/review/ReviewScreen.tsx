import { useState } from "react";
import type { QuestionBank } from "../../data/types";
import { NoteSheet } from "../../features/notes/NoteSheet";
import { Button, IconButton } from "../../shared/ui/Button";
import { ActionBar, Screen, TopBar } from "../../shared/ui/Screen";
import { QuestionView } from "../question/QuestionView";
import styles from "./ReviewScreen.module.css";

interface ReviewScreenProps {
  bank: QuestionBank;
  questionId: string;
  onBack: () => void;
}

/** Разбор одного вопроса: сразу с ответом и пояснениями. Открывается из итога сессии и из заметок. */
export function ReviewScreen({ bank, questionId, onBack }: ReviewScreenProps) {
  const [noteOpen, setNoteOpen] = useState(false);
  const question = bank.byId.get(questionId);

  return (
    <Screen>
      <TopBar>
        <IconButton icon="arrowLeft" label="Назад" onClick={onBack} />
        <span className={styles.title}>Разбор вопроса</span>
        <span className={styles.spacer} />
      </TopBar>

      {question ? (
        <>
          <QuestionView
            bank={bank}
            question={question}
            optionOrder={question.options.map((_, i) => i)}
            picked={null}
            reveal
            onEditNote={() => setNoteOpen(true)}
          />
          <ActionBar>
            <Button variant="secondary" icon="pencil" onClick={() => setNoteOpen(true)}>
              Заметка
            </Button>
            <Button icon="arrowLeft" onClick={onBack}>
              Назад
            </Button>
          </ActionBar>
          <NoteSheet question={noteOpen ? question : null} onClose={() => setNoteOpen(false)} />
        </>
      ) : (
        <p className={styles.missing}>Этого вопроса больше нет в базе.</p>
      )}
    </Screen>
  );
}
