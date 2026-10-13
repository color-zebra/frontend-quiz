import { readStorage, writeStorage } from "../../shared/lib/storage";

// Крошечный файл рядом с базой: только дата её сборки. Его проверяем при запуске вместо всей базы (1,8 МБ).
const VERSION_URL = `${import.meta.env.BASE_URL}questions-version.json`;
/** Версия базы, о которой плашку уже закрыли: про неё больше не напоминаем. */
const DISMISSED_KEY = "fq.dismissedBankVersion";

/** Дата сборки базы на сервере; null — нет связи или файла, тогда просто молчим. */
export async function fetchBankVersion(): Promise<string | null> {
  try {
    const response = await fetch(`${VERSION_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return null;
    const data = (await response.json()) as { generatedAt?: unknown };
    return typeof data.generatedAt === "string" ? data.generatedAt : null;
  } catch {
    return null;
  }
}

/** Есть ли на сервере база свежее этой и не закрыта ли про неё плашка. Даты — ISO-строки, сравниваются как строки. */
export function getIsNewerBank(remote: string | null, local: string | undefined) {
  if (!remote || !local || remote <= local) return false;
  return readStorage(DISMISSED_KEY) !== remote;
}

export function dismissBankVersion(version: string) {
  writeStorage(DISMISSED_KEY, version);
}
