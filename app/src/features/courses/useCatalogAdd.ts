import { useState } from "react";
import { getErrorText, getReportText } from "../../screens/sets/setMessages";
import type { CatalogEntry } from "../sets/catalog";
import { useSets } from "../sets/SetsProvider";
import { SetNetworkError } from "../sets/loadSet";
import type { SetRecord } from "../sets/setsStore";

/**
 * Скачать курс (или устную тренировку) из каталога — «Начать курс». Тот же путь, что у «Добавить» в каталоге
 * наборов: нет сети — честное «нет интернета», замечания к файлу — текстом под кнопкой.
 */
export function useCatalogAdd() {
  const { addSet } = useSets();
  const [busyUrl, setBusyUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<{ url: string; kind: "ok" | "error"; text: string } | null>(null);

  async function add(entry: CatalogEntry): Promise<SetRecord | null> {
    setBusyUrl(entry.url);
    setMessage(null);
    try {
      const { record, skipped, warnings } = await addSet(entry.url);
      const report = getReportText({ skipped, warnings });
      if (report) setMessage({ url: entry.url, kind: "ok", text: `Курс скачан.${report}` });
      return record;
    } catch (error) {
      setMessage({
        url: entry.url,
        kind: "error",
        text:
          error instanceof SetNetworkError
            ? "Не удалось скачать курс — похоже, нет интернета. Проверь связь и попробуй ещё раз."
            : `Не удалось скачать курс: ${getErrorText(error)}`,
      });
      return null;
    } finally {
      setBusyUrl(null);
    }
  }

  return { add, busyUrl, message, clearMessage: () => setMessage(null) };
}
