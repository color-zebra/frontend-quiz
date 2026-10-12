import clsx from "clsx";
import { useRef, useState, type ChangeEvent } from "react";
import { formatTopicLine } from "../../data/titles";
import { BUILTIN_SET_ID, type QuestionBank } from "../../data/types";
import { useNotes, type ImportStats } from "../../features/notes/NotesProvider";
import { exportNotes, parseNotesFile } from "../../features/notes/notesFile";
import type { Note } from "../../features/notes/types";
import { NOTE_FORMS, plural } from "../../shared/lib/plural";
import { Button, IconButton } from "../../shared/ui/Button";
import glass from "../../shared/ui/glass.module.css";
import { Icon } from "../../shared/ui/Icon";
import { LevelBadge } from "../../shared/ui/LevelBadge";
import { Markdown } from "../../shared/ui/Markdown";
import { Screen, TopBar } from "../../shared/ui/Screen";
import { ScreenTitle } from "../../shared/ui/ScreenTitle";
import styles from "./NotesScreen.module.css";

interface NotesScreenProps {
  /** База по метке набора; undefined — набор удалён. */
  getBank: (setId: string) => QuestionBank | undefined;
  onBack: () => void;
  onOpenQuestion: (setId: string, questionId: string) => void;
}

type ImportMessage = { kind: "ok"; stats: ImportStats } | { kind: "error"; text: string };

function formatImportStats({ added, updated, skipped }: ImportStats) {
  const parts = [`добавлено ${added}`, `обновлено ${updated}`];
  if (skipped) parts.push(`пропущено ${skipped} — у тебя версия новее или такая же`);
  return `Загружено: ${parts.join(", ")}.`;
}

const dateFormat = new Intl.DateTimeFormat("ru", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

export function NotesScreen({ getBank, onBack, onOpenQuestion }: NotesScreenProps) {
  const { notes, status, deleteNote, importNotes } = useNotes();
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<ImportMessage | null>(null);
  const list = [...notes.values()].sort((a, b) => b.updatedAt - a.updatedAt);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setMessage({ kind: "ok", stats: importNotes(parseNotesFile(await file.text())) });
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "Не удалось прочитать файл" });
    }
  }

  return (
    <Screen>
      <TopBar>
        <IconButton icon="arrowLeft" label="Назад" onClick={onBack} />
      </TopBar>

      <ScreenTitle title="Мои заметки" subtitle={`${list.length} ${plural(list.length, NOTE_FORMS)} на этом устройстве`} />

      {status === "unavailable" && (
        <p className={clsx(styles.banner, glass.glass)}>
          Браузер не даёт сохранять данные, поэтому заметки пропадут после закрытия вкладки. Выгрузи их в файл, чтобы не
          потерять.
        </p>
      )}

      <div className={styles.fileButtons}>
        <Button variant="secondary" icon="download" disabled={list.length === 0} onClick={() => exportNotes(list)}>
          Выгрузить
        </Button>
        <Button variant="secondary" icon="upload" onClick={() => fileInput.current?.click()}>
          Загрузить
        </Button>
        <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={handleFile} />
      </div>
      <p className={styles.hint}>Файл выгрузки — это резервная копия и способ перенести заметки на другое устройство.</p>

      {message && (
        <p className={clsx(styles.message, message.kind === "error" && styles.error)} role="status">
          {message.kind === "ok" ? formatImportStats(message.stats) : message.text}
        </p>
      )}

      {status !== "loading" && list.length === 0 && (
        <p className={styles.empty}>Заметок пока нет. Открой любой вопрос и нажми «Заметка».</p>
      )}

      <ul className={styles.list}>
        {list.map((note) => (
          <li key={note.key}>
            <NoteCard note={note} bank={getBank(note.setId)} onOpen={onOpenQuestion} onDelete={deleteNote} />
          </li>
        ))}
      </ul>
    </Screen>
  );
}

interface NoteCardProps {
  note: Note;
  bank: QuestionBank | undefined;
  onOpen: (setId: string, questionId: string) => void;
  onDelete: (key: string) => void;
}

function NoteCard({ note, bank, onOpen, onDelete }: NoteCardProps) {
  const exists = !!bank?.byId.has(note.questionId);
  const isOwnSet = note.setId !== BUILTIN_SET_ID;
  const setTitle = bank?.title ?? note.snapshot.setTitle ?? "свой набор";
  const body = (
    <>
      {isOwnSet && <span className={styles.setLabel}>Набор «{setTitle}»</span>}
      <span className={styles.meta}>
        <LevelBadge level={note.snapshot.level} /> {formatTopicLine(note.snapshot.topicTitle, note.snapshot.subtopicTitle)}
      </span>
      <Markdown text={note.snapshot.question} inline className={styles.question} />
      <span className={styles.text}>{note.text}</span>
      <span className={styles.date}>{dateFormat.format(note.updatedAt)}</span>
    </>
  );

  if (exists) {
    return (
      <button type="button" className={clsx(styles.card, glass.glass)} onClick={() => onOpen(note.setId, note.questionId)}>
        {body}
        <Icon name="chevronRight" className={styles.chevron} />
      </button>
    );
  }

  return (
    <div className={clsx(styles.card, styles.orphan, glass.glass)}>
      <span className={styles.orphanLabel}>{bank ? "Вопроса больше нет в базе" : "Набор удалён"}</span>
      {body}
      <IconButton icon="trash" label="Удалить заметку" className={styles.chevron} onClick={() => onDelete(note.key)} />
    </div>
  );
}
