import clsx from "clsx";
import { useState, type FormEvent } from "react";
import { formatDiff } from "../../data/formatDiff";
import { useSets } from "../../features/sets/SetsProvider";
import type { SetRecord } from "../../features/sets/setsStore";
import { formatShortDate } from "../../shared/lib/formatDate";
import { countQuestions } from "../../shared/lib/plural";
import { Button, IconButton } from "../../shared/ui/Button";
import { Card } from "../../shared/ui/Card";
import glass from "../../shared/ui/glass.module.css";
import { Icon } from "../../shared/ui/Icon";
import { Notice } from "../../shared/ui/Notice";
import { Screen, TopBar } from "../../shared/ui/Screen";
import { ScreenTitle } from "../../shared/ui/ScreenTitle";
import { Sheet } from "../../shared/ui/Sheet";
import styles from "./SetsScreen.module.css";

import { SAMPLE_SET_URL } from "../../config";

type Message = { kind: "ok" | "error"; text: string };

function getErrorText(error: unknown) {
  return error instanceof Error ? error.message : "Неизвестная ошибка";
}

function getSkippedText(skipped: number) {
  return skipped ? ` Пропущено ${skipped}: их не удалось прочитать или повторился id.` : "";
}

/** «raw.githubusercontent.com/…/sample-set.yaml» → «color-zebra/frontend-quiz › sample-set.yaml». */
function formatSource(url: string) {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  const file = decodeURIComponent(parts[parts.length - 1] ?? "");
  return parts.length >= 2 ? `${parts[0]}/${parts[1]} › ${file}` : url;
}

interface SetsScreenProps {
  onBack: () => void;
  onOpenSet: (setId: string) => void;
  onOpenHelp: () => void;
}

export function SetsScreen({ onBack, onOpenSet, onOpenHelp }: SetsScreenProps) {
  const { sets, persistent, addSet, updateSet, removeSet } = useSets();
  const [link, setLink] = useState("");
  const [adding, setAdding] = useState(false);
  const [addMessage, setAddMessage] = useState<Message | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [setMessages, setSetMessages] = useState<Record<string, Message>>({});
  const [toDelete, setToDelete] = useState<SetRecord | null>(null);

  function showSetMessage(id: string, message: Message | null) {
    setSetMessages((prev) => {
      const next = { ...prev };
      if (message) next[id] = message;
      else delete next[id];
      return next;
    });
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!link.trim() || adding) return;
    setAdding(true);
    setAddMessage(null);
    try {
      const { record, skipped } = await addSet(link);
      setAddMessage({
        kind: "ok",
        text: `Добавлен «${record.title}»: ${countQuestions(record.file.questions.length)}.${getSkippedText(skipped)}`,
      });
      setLink("");
    } catch (error) {
      setAddMessage({ kind: "error", text: getErrorText(error) });
    } finally {
      setAdding(false);
    }
  }

  async function handleUpdate(record: SetRecord) {
    setBusyId(record.id);
    showSetMessage(record.id, null);
    try {
      const { diff, skipped } = await updateSet(record.id);
      showSetMessage(record.id, {
        kind: "ok",
        text: formatDiff(diff, "Набор обновлён", "Набор не изменился.") + getSkippedText(skipped),
      });
    } catch (error) {
      showSetMessage(record.id, { kind: "error", text: `Не удалось обновить: ${getErrorText(error)}` });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Screen>
      <TopBar>
        <IconButton icon="arrowLeft" label="Назад" onClick={onBack} />
      </TopBar>

      <ScreenTitle title="Мои наборы" subtitle="Свои вопросы из YAML-файла на GitHub" />

      {!persistent && (
        <p className={clsx(styles.banner, glass.glass)}>
          Браузер не даёт сохранять данные, поэтому наборы пропадут после закрытия вкладки.
        </p>
      )}

      <Card label="Добавить набор">
        <form className={styles.form} onSubmit={handleAdd} noValidate>
          <input
            className={styles.input}
            type="url"
            inputMode="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://github.com/…/questions.yaml"
            aria-label="Ссылка на YAML-файл на GitHub"
          />
          <Button type="submit" icon="plus" disabled={!link.trim() || adding}>
            {adding ? "Загружаем…" : "Добавить"}
          </Button>
        </form>
        <p className={styles.help}>
          Подойдёт ссылка на YAML-файл в публичном репозитории или gist. Как добавить, написать свой набор и
          поделиться им —{" "}
          <button type="button" className={styles.helpLink} onClick={onOpenHelp}>
            инструкция
          </button>
          .
        </p>
        <button type="button" className={styles.sample} onClick={() => setLink(SAMPLE_SET_URL)}>
          Подставить ссылку на пример
        </button>
      </Card>

      {addMessage && <Notice kind={addMessage.kind} text={addMessage.text} onClose={() => setAddMessage(null)} />}

      {sets.length === 0 && <p className={styles.empty}>Наборов пока нет.</p>}

      <ul className={styles.list}>
        {sets.map((record) => {
          const message = setMessages[record.id];
          return (
            <li key={record.id} className={styles.item}>
              <div className={clsx(styles.card, glass.glass)}>
                <button type="button" className={styles.open} onClick={() => onOpenSet(record.id)}>
                  <span className={styles.title}>{record.title}</span>
                  <span className={styles.meta}>
                    {countQuestions(record.file.questions.length)} · обновлён {formatShortDate(record.updatedAt)}
                  </span>
                  <span className={styles.source}>{formatSource(record.url)}</span>
                </button>
                <div className={styles.actions}>
                  <IconButton
                    icon="refresh"
                    label={`Обновить «${record.title}»`}
                    busy={busyId === record.id}
                    onClick={() => handleUpdate(record)}
                  />
                  <IconButton icon="trash" label={`Удалить «${record.title}»`} onClick={() => setToDelete(record)} />
                  <Icon name="chevronRight" className={styles.chevron} />
                </div>
              </div>
              {message && (
                <Notice kind={message.kind} text={message.text} onClose={() => showSetMessage(record.id, null)} />
              )}
            </li>
          );
        })}
      </ul>

      <Sheet open={!!toDelete} title="Удалить набор?" onClose={() => setToDelete(null)}>
        {toDelete && (
          <div className={styles.confirm}>
            <p>
              Набор «{toDelete.title}» пропадёт с этого устройства. Заметки к его вопросам останутся в «Моих заметках»,
              а если добавить набор по той же ссылке снова, они вернутся к вопросам.
            </p>
            <div className={styles.confirmButtons}>
              <Button variant="secondary" onClick={() => setToDelete(null)}>
                Отмена
              </Button>
              <Button
                icon="trash"
                onClick={() => {
                  removeSet(toDelete.id);
                  showSetMessage(toDelete.id, null);
                  setToDelete(null);
                }}
              >
                Удалить
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </Screen>
  );
}
