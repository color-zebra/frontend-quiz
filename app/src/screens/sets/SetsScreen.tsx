import clsx from "clsx";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { SAMPLE_SET_URL } from "../../config";
import { formatDiff } from "../../data/formatDiff";
import { useSets } from "../../features/sets/SetsProvider";
import type { SkippedQuestion } from "../../features/sets/parseSet";
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

type Message = { kind: "ok" | "error"; text: string; skipped?: SkippedQuestion[]; warnings?: string[] };

/** Что приложение сказало о файле набора: пропущенные вопросы и замечания. */
interface FileReport {
  skipped: readonly SkippedQuestion[];
  warnings: readonly string[];
}

function getErrorText(error: unknown) {
  return error instanceof Error ? error.message : "Неизвестная ошибка";
}

/** Вопросов в наборе: тестовый набор — тестовые, устный — устные. */
function getQuestionCount(record: SetRecord) {
  return record.file.questions.length + (record.file.speech?.length ?? 0);
}

/** Пометка устного набора в списке. */
function getKindLabel(record: SetRecord) {
  return record.file.speech?.length ? "устные · " : "";
}

function getReportText({ skipped, warnings }: FileReport) {
  if (skipped.length && warnings.length) return ` Пропущено ${skipped.length}, есть замечания к файлу — подробности ниже.`;
  if (skipped.length) return ` Пропущено ${skipped.length} — причины ниже.`;
  if (warnings.length) return " Есть замечания к файлу — подробности ниже.";
  return "";
}

/** Подробности для сообщения: какие вопросы набора пропущены и почему, что поправить в файле. */
function getReportDetails(message: Message) {
  const skipped = message.skipped ?? [];
  const warnings = message.warnings ?? [];
  if (!skipped.length && !warnings.length) return undefined;
  const title = !warnings.length ? "Что пропущено" : skipped.length ? "Что пропущено и что поправить" : "Что поправить в файле";
  return { title, items: [...skipped.map((s) => `${s.label}: ${s.reason}`), ...warnings] };
}

/**
 * Откуда набор: GitHub — «владелец/репозиторий › файл», остальные сайты — «сайт › файл».
 * «raw.githubusercontent.com/color-zebra/frontend-quiz/main/examples/sample-set.yaml» → «color-zebra/frontend-quiz › sample-set.yaml».
 */
function formatSource(record: SetRecord) {
  if (!record.url) return `Файл с устройства · ${record.fileName}`;
  const { hostname, pathname } = new URL(record.url);
  const parts = pathname.split("/").filter(Boolean);
  const file = decodeURIComponent(parts[parts.length - 1] ?? "");
  const isGitHub = hostname === "raw.githubusercontent.com" || hostname === "gist.githubusercontent.com";
  if (isGitHub && parts.length >= 2) return `${parts[0]}/${parts[1]} › ${file}`;
  return file ? `${hostname} › ${file}` : hostname;
}

interface SetsScreenProps {
  onBack: () => void;
  onOpenSet: (setId: string) => void;
  onOpenHelp: () => void;
}

export function SetsScreen({ onBack, onOpenSet, onOpenHelp }: SetsScreenProps) {
  const { sets, persistent, addSet, importSetFile, updateSet, removeSet } = useSets();
  const fileInput = useRef<HTMLInputElement>(null);
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
      const { record, skipped, warnings } = await addSet(link);
      setAddMessage({
        kind: "ok",
        text: `Добавлен «${record.title}»: ${countQuestions(getQuestionCount(record))}.${getReportText({ skipped, warnings })}`,
        skipped,
        warnings,
      });
      setLink("");
    } catch (error) {
      setAddMessage({ kind: "error", text: getErrorText(error) });
    } finally {
      setAdding(false);
    }
  }

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || adding) return;
    setAdding(true);
    setAddMessage(null);
    try {
      const result = await importSetFile(file);
      const title = result.record.title;
      const text =
        result.kind === "added"
          ? `Добавлен «${title}»: ${countQuestions(getQuestionCount(result.record))}.`
          : formatDiff(result.diff, `Набор «${title}» обновлён`, `Набор «${title}» не изменился.`);
      setAddMessage({ kind: "ok", text: text + getReportText(result), skipped: result.skipped, warnings: result.warnings });
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
      const { diff, skipped, warnings } = await updateSet(record.id);
      showSetMessage(record.id, {
        kind: "ok",
        text: formatDiff(diff, "Набор обновлён", "Набор не изменился.") + getReportText({ skipped, warnings }),
        skipped,
        warnings,
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

      <ScreenTitle title="Мои наборы" subtitle="Свои вопросы из YAML-файла — по ссылке или с устройства" />

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
            placeholder="https://…/questions.yaml"
            aria-label="Ссылка на YAML-файл"
          />
          <Button type="submit" icon="plus" disabled={!link.trim() || adding}>
            {adding ? "Загружаем…" : "Добавить"}
          </Button>
        </form>
        <Button
          variant="secondary"
          icon="upload"
          className={styles.fileButton}
          disabled={adding}
          onClick={() => fileInput.current?.click()}
        >
          Загрузить файл с устройства
        </Button>
        {/* Без accept: Android часто не знает тип .yaml и прячет такие файлы из выбора. */}
        <input ref={fileInput} type="file" hidden onChange={handleFile} />
        <p className={styles.help}>
          Подойдёт прямая ссылка на YAML-файл — например, на GitHub или в gist — либо сам файл. Файл с тем же именем,
          загруженный ещё раз, обновит набор. Как добавить, написать свой набор и поделиться им —{" "}
          <button type="button" className={styles.helpLink} onClick={onOpenHelp}>
            инструкция
          </button>
          .
        </p>
        <button type="button" className={styles.sample} onClick={() => setLink(SAMPLE_SET_URL)}>
          Подставить ссылку на пример
        </button>
      </Card>

      {addMessage && <Notice
          kind={addMessage.kind}
          text={addMessage.text}
          details={getReportDetails(addMessage)}
          onClose={() => setAddMessage(null)}
        />}

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
                    {getKindLabel(record)}
                    {countQuestions(getQuestionCount(record))} · обновлён {formatShortDate(record.updatedAt)}
                  </span>
                  <span className={styles.source}>{formatSource(record)}</span>
                </button>
                <div className={styles.actions}>
                  {record.url && (
                    <IconButton
                      icon="refresh"
                      label={`Обновить «${record.title}»`}
                      busy={busyId === record.id}
                      onClick={() => handleUpdate(record)}
                    />
                  )}
                  <IconButton icon="trash" label={`Удалить «${record.title}»`} onClick={() => setToDelete(record)} />
                  <Icon name="chevronRight" className={styles.chevron} />
                </div>
              </div>
              {message && (
                <Notice
                  kind={message.kind}
                  text={message.text}
                  details={getReportDetails(message)}
                  onClose={() => showSetMessage(record.id, null)}
                />
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
