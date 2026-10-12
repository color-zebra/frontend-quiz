import clsx from "clsx";
import { useRef, useState, type ChangeEvent } from "react";
import type { QuestionBank } from "../../data/types";
import { exportBackup, parseBackupFile } from "../../features/backup/backupFile";
import { useNotes, type ImportStats } from "../../features/notes/NotesProvider";
import { useProgress } from "../../features/progress/ProgressProvider";
import { getBankStats } from "../../features/progress/stats";
import { NOTE_FORMS, plural } from "../../shared/lib/plural";
import { Button, IconButton } from "../../shared/ui/Button";
import { Card } from "../../shared/ui/Card";
import glass from "../../shared/ui/glass.module.css";
import { Icon } from "../../shared/ui/Icon";
import { Screen, TopBar } from "../../shared/ui/Screen";
import { ScreenTitle } from "../../shared/ui/ScreenTitle";
import { Sheet } from "../../shared/ui/Sheet";
import { THEMES, type ThemeId } from "../../theme/themes";
import styles from "./CabinetScreen.module.css";

interface CabinetScreenProps {
  bank: QuestionBank;
  theme: ThemeId;
  onBack: () => void;
  onOpenStats: () => void;
  onOpenNotes: () => void;
  onOpenTheme: () => void;
}

type Message = { kind: "ok" | "error"; text: string };

function formatImport(notes: ImportStats, answers: number | null) {
  const skipped = notes.skipped ? `, пропущено ${notes.skipped} — у тебя версия новее или такая же` : "";
  const notesPart = `Заметки: добавлено ${notes.added}, обновлено ${notes.updated}${skipped}.`;
  const answersPart = answers === null ? "Ответов в файле нет — это старая копия с одними заметками." : `Ответы: добавлено ${answers}.`;
  return `Копия загружена. ${notesPart} ${answersPart}`;
}

/** Кабинет: статистика, заметки, оформление и всё, что хранится на устройстве, — копия и сброс. */
export function CabinetScreen({ bank, theme, onBack, onOpenStats, onOpenNotes, onOpenTheme }: CabinetScreenProps) {
  const { notes, importNotes } = useNotes();
  const { records, getProgress, importRecords, resetAll } = useProgress();
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const stats = getBankStats(bank, records, (id) => getProgress(bank.setId, id));
  const statsLine = stats.seen
    ? `видел ${stats.seen} из ${stats.total} · верных ${Math.round(stats.answers.accuracy * 100)} %`
    : "ещё нет ответов";

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const backup = parseBackupFile(await file.text());
      const notesStats = importNotes(backup.notes);
      const answers = backup.answers && importRecords(backup.answers);
      setMessage({ kind: "ok", text: formatImport(notesStats, answers) });
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "Не удалось прочитать файл" });
    }
  }

  return (
    <Screen>
      <TopBar>
        <IconButton icon="arrowLeft" label="Назад" onClick={onBack} />
      </TopBar>
      <ScreenTitle title="Кабинет" subtitle="Всё здесь хранится только на этом устройстве" />

      <div className={styles.tiles}>
        <button type="button" className={clsx(styles.tile, styles.wide, glass.glass)} onClick={onOpenStats}>
          <Icon name="chart" />
          <span className={styles.tileTitle}>Статистика</span>
          <span className={styles.tileSub}>{statsLine}</span>
        </button>
        <button type="button" className={clsx(styles.tile, glass.glass)} onClick={onOpenNotes}>
          <Icon name="pencil" />
          <span className={styles.tileTitle}>Мои заметки</span>
          <span className={styles.tileSub}>
            {notes.size} {plural(notes.size, NOTE_FORMS)}
          </span>
        </button>
        <button type="button" className={clsx(styles.tile, glass.glass)} onClick={onOpenTheme}>
          <Icon name="palette" />
          <span className={styles.tileTitle}>Оформление</span>
          <span className={styles.tileSub}>{THEMES.find((t) => t.id === theme)?.name}</span>
        </button>
      </div>

      <Card label="Данные на этом устройстве">
        <p className={styles.hint}>
          Заметки и ответы — в одном файле. Сохрани копию, перенеси файл на другой телефон или ноутбук (например,
          отправь себе в Telegram) и загрузи там. Повторная загрузка ничего не задвоит.
        </p>
        <div className={styles.fileButtons}>
          <Button
            variant="secondary"
            icon="download"
            disabled={notes.size === 0 && records.length === 0}
            onClick={() => exportBackup([...notes.values()], records)}
          >
            Сохранить копию
          </Button>
          <Button variant="secondary" icon="upload" onClick={() => fileInput.current?.click()}>
            Загрузить копию
          </Button>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={handleFile} />
        </div>
        {message && (
          <p className={clsx(styles.message, message.kind === "error" && styles.error)} role="status">
            {message.text}
          </p>
        )}
      </Card>

      {records.length > 0 && (
        <Button variant="secondary" icon="trash" onClick={() => setConfirmOpen(true)}>
          Сбросить статистику
        </Button>
      )}

      <Sheet open={confirmOpen} title="Сбросить статистику?" onClose={() => setConfirmOpen(false)}>
        <div className={styles.confirm}>
          <p>
            Удалятся все твои ответы на этом устройстве — и в основной базе, и в своих наборах: ошибки, новые вопросы
            и статистика начнутся с нуля. Заметки и наборы останутся. Отменить сброс нельзя.
          </p>
          <div className={styles.confirmButtons}>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Отмена
            </Button>
            <Button
              icon="trash"
              onClick={() => {
                resetAll();
                setConfirmOpen(false);
              }}
            >
              Сбросить
            </Button>
          </div>
        </div>
      </Sheet>
    </Screen>
  );
}
