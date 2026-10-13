import { useState } from "react";
import { getHasExplanation } from "../../data/answers";
import type { QuestionBank } from "../../data/types";
import { ComplaintButton, ComplaintSheet } from "../../features/complaint/ComplaintSheet";
import { NoteSheet } from "../../features/notes/NoteSheet";
import { useNotes } from "../../features/notes/NotesProvider";
import { Button, IconButton } from "../../shared/ui/Button";
import { ActionBar, Screen, TopBar } from "../../shared/ui/Screen";
import { BookmarkButton, ToolsCapsule } from "../question/QuestionTools";
import { QuestionView } from "../question/QuestionView";
import { useIsOnScreen, WhyButton } from "../question/WhyButton";
import styles from "./ReviewScreen.module.css";

interface ReviewScreenProps {
  /** Нет, если набор удалён. */
  bank: QuestionBank | undefined;
  questionId: string;
  onBack: () => void;
}

/** Разбор одного вопроса: сразу с ответом и пояснениями. Открывается из итога сессии и из заметок. */
export function ReviewScreen({ bank, questionId, onBack }: ReviewScreenProps) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [complaintOpen, setComplaintOpen] = useState(false);
  const question = bank?.byId.get(questionId);
  const { getNote } = useNotes();
  const hasNote = !!bank && !!question && !!getNote(bank.setId, question.id);
  const [explanationRef, explanationOnScreen] = useIsOnScreen();
  const showWhy = !!question && getHasExplanation(question) && !explanationOnScreen;

  return (
    <Screen>
      <TopBar>
        <IconButton icon="arrowLeft" label="Назад" onClick={onBack} />
        <span className={styles.title}>Разбор вопроса</span>
        {bank && question ? (
          <ToolsCapsule>
            <ComplaintButton bare onClick={() => setComplaintOpen(true)} />
            <BookmarkButton setId={bank.setId} questionId={question.id} />
          </ToolsCapsule>
        ) : (
          <span className={styles.spacer} />
        )}
      </TopBar>

      {bank && question ? (
        <>
          <QuestionView
            bank={bank}
            question={question}
            optionOrder={question.options.map((_, i) => i)}
            selected={[]}
            answered={false}
            reveal
            explanationRef={explanationRef}
          />
          <ActionBar aside={showWhy && <WhyButton question={question} />}>
            <Button variant="secondary" icon="pencil" marked={hasNote} onClick={() => setNoteOpen(true)}>
              Заметка
            </Button>
            <Button icon="arrowLeft" onClick={onBack}>
              Назад
            </Button>
          </ActionBar>
          <NoteSheet bank={bank} question={noteOpen ? question : null} onClose={() => setNoteOpen(false)} />
          <ComplaintSheet bank={bank} question={complaintOpen ? question : null} onClose={() => setComplaintOpen(false)} />
        </>
      ) : (
        <p className={styles.missing}>{bank ? "Этого вопроса больше нет в базе." : "Набор с этим вопросом удалён."}</p>
      )}
    </Screen>
  );
}
