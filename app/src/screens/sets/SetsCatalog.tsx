import clsx from "clsx";
import { Fragment, useState } from "react";
import { CATALOG, findAddedSet, type CatalogEntry } from "../../features/sets/catalog";
import { SetNetworkError } from "../../features/sets/loadSet";
import { useSets } from "../../features/sets/SetsProvider";
import { formatRawSource } from "../../features/sets/setUrl";
import type { SetRecord } from "../../features/sets/setsStore";
import { countQuestions, plural } from "../../shared/lib/plural";
import { readStorage, writeStorage } from "../../shared/lib/storage";
import { Button } from "../../shared/ui/Button";
import { SectionLabel } from "../../shared/ui/Card";
import glass from "../../shared/ui/glass.module.css";
import { Icon } from "../../shared/ui/Icon";
import { Notice } from "../../shared/ui/Notice";
import { getErrorText, getQuestionCount, getReportDetails, getReportText, type Message } from "./setMessages";
import styles from "./SetsCatalog.module.css";

/** Свёрнут ли каталог: запоминаем выбор, в первый раз каталог открыт — чтобы его заметили. */
const OPEN_KEY = "fq.setsCatalogOpen";
const SET_FORMS = ["набор", "набора", "наборов"] as const;

/** «junior–senior» или один уровень, если других в наборе нет. */
function getLevelsText(levels: readonly string[]) {
  return levels.length > 1 ? `${levels[0]}–${levels[levels.length - 1]}` : (levels[0] ?? "");
}

/**
 * Подпись под названием: «добавлен · 53 вопроса · junior–senior». У добавленного набора число — из него самого.
 * Набор не из custom-sets/ сборка не читала: пока его нет на устройстве, вместо цифр — откуда он.
 * Части не рвутся посередине: на узком экране «junior–senior» переносится целиком.
 */
function CatalogMeta({ entry, record }: { entry: CatalogEntry; record: SetRecord | undefined }) {
  const count = record ? getQuestionCount(record) : entry.count;
  if (count === undefined) {
    return <span className={styles.meta}>{entry.rawUrl ? formatRawSource(entry.rawUrl) : entry.url}</span>;
  }
  const speech = record ? !!record.file.speech?.length : entry.speech;
  const parts = [speech ? "устные" : "", countQuestions(count), getLevelsText(entry.levels)].filter(Boolean);
  return (
    <span className={styles.meta}>
      {record && <span className={clsx(styles.metaPart, styles.addedText)}>добавлен</span>}
      {parts.map((part, index) => (
        <Fragment key={part}>
          {(record || index > 0) && " · "}
          <span className={styles.metaPart}>{part}</span>
        </Fragment>
      ))}
    </span>
  );
}

/** Строка под заголовком: сколько наборов в каталоге и сколько из них уже на устройстве. */
function getSummary(total: number, added: number) {
  const count = `${total} ${plural(total, SET_FORMS)}`;
  if (added === 0) return count;
  return `${count} · ${added === total ? "все уже у тебя" : `${added} уже у тебя`}`;
}

/** Каталог готовых наборов: список из custom-sets/catalog.yaml, набор скачивается по кнопке «Добавить». */
export function SetsCatalog({ onOpenSet }: { onOpenSet: (setId: string) => void }) {
  const { sets, addSet } = useSets();
  const [open, setOpen] = useState(() => readStorage(OPEN_KEY) !== "0");
  const [busyKeys, setBusyKeys] = useState<string[]>([]);
  const [messages, setMessages] = useState<Record<string, Message>>({});

  if (CATALOG.length === 0) return null;
  const added = CATALOG.filter((entry) => findAddedSet(entry, sets)).length;

  function showMessage(key: string, message: Message | null) {
    setMessages((prev) => {
      const next = { ...prev };
      if (message) next[key] = message;
      else delete next[key];
      return next;
    });
  }

  async function handleAdd(entry: CatalogEntry) {
    setBusyKeys((prev) => [...prev, entry.url]);
    showMessage(entry.url, null);
    try {
      const { record, skipped, warnings } = await addSet(entry.url);
      // Об удаче говорит сама кнопка («Открыть»); сообщение — только если в файле что-то не так.
      const report = getReportText({ skipped, warnings });
      if (report) showMessage(entry.url, { kind: "ok", text: `Добавлен «${record.title}».${report}`, skipped, warnings });
    } catch (error) {
      const text =
        error instanceof SetNetworkError
          ? "Не удалось скачать набор — похоже, нет интернета. Проверь связь и нажми «Добавить» ещё раз."
          : `Не удалось добавить набор: ${getErrorText(error)}`;
      showMessage(entry.url, { kind: "error", text });
    } finally {
      setBusyKeys((prev) => prev.filter((key) => key !== entry.url));
    }
  }

  return (
    <details
      className={clsx(styles.catalog, glass.glass)}
      open={open}
      onToggle={(e) => {
        const next = e.currentTarget.open;
        setOpen(next);
        writeStorage(OPEN_KEY, next ? "1" : "0");
      }}
    >
      <summary className={styles.summary}>
        <span className={styles.head}>
          <SectionLabel className={styles.label}>Готовые наборы</SectionLabel>
          <span className={styles.line}>{getSummary(CATALOG.length, added)}</span>
        </span>
        <Icon name="chevronRight" className={styles.marker} />
      </summary>
      <ul className={styles.list}>
        {CATALOG.map((entry) => {
          const record = findAddedSet(entry, sets);
          const message = messages[entry.url];
          return (
            <CatalogRow
              key={entry.url}
              entry={entry}
              record={record}
              busy={busyKeys.includes(entry.url)}
              // Ошибка уместна, пока набора нет, отчёт о добавлении — пока он есть: удалили набор — отчёт ушёл.
              message={message && (message.kind === "ok") === !!record ? message : undefined}
              onAdd={() => handleAdd(entry)}
              onOpen={onOpenSet}
              onCloseMessage={() => showMessage(entry.url, null)}
            />
          );
        })}
      </ul>
    </details>
  );
}

interface CatalogRowProps {
  entry: CatalogEntry;
  /** Этот набор уже на устройстве. */
  record: SetRecord | undefined;
  busy: boolean;
  message: Message | undefined;
  onAdd: () => void;
  onOpen: (setId: string) => void;
  onCloseMessage: () => void;
}

/**
 * Пункт каталога — сворачиваемая карточка. Свёрнута: название и сколько вопросов каких уровней, по строке с троеточием;
 * раскрыта: всё целиком, описание и кнопка «Добавить» или «Открыть». Добавленный набор видно и в свёрнутом виде:
 * зелёная рамка и «добавлен».
 */
function CatalogRow({ entry, record, busy, message, onAdd, onOpen, onCloseMessage }: CatalogRowProps) {
  return (
    <li className={styles.row}>
      <details className={clsx(styles.item, glass.glass, record && styles.added)}>
        <summary className={styles.itemSummary}>
          <span className={styles.itemHead}>
            <span className={styles.title}>{entry.title}</span>
            <CatalogMeta entry={entry} record={record} />
          </span>
          <Icon name="chevronRight" className={styles.itemMarker} />
        </summary>
        <div className={styles.itemBody}>
          <p className={styles.description}>{entry.description}</p>
          {record ? (
            <Button
              variant="secondary"
              iconAfter="arrowRight"
              className={styles.action}
              aria-label={`Открыть «${entry.title}»`}
              onClick={() => onOpen(record.id)}
            >
              Открыть
            </Button>
          ) : (
            <Button
              variant="secondary"
              icon="plus"
              className={clsx(styles.action, styles.add)}
              disabled={busy}
              aria-busy={busy || undefined}
              aria-label={`Добавить «${entry.title}»`}
              onClick={onAdd}
            >
              {busy ? "Загружаем…" : "Добавить"}
            </Button>
          )}
        </div>
      </details>
      {message && (
        <Notice kind={message.kind} text={message.text} details={getReportDetails(message)} onClose={onCloseMessage} />
      )}
    </li>
  );
}
