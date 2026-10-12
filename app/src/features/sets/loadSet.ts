import { getTitleFromUrl } from "./githubUrl";
import { parseSetFile, type ParsedSet } from "./parseSet";

/** Скачивает и разбирает файл набора по ссылке на сырой файл. */
export async function fetchSet(rawUrl: string): Promise<ParsedSet> {
  let response: Response;
  try {
    // Метка времени — чтобы кэш GitHub не отдал старую версию файла.
    response = await fetch(`${rawUrl}${rawUrl.includes("?") ? "&" : "?"}t=${Date.now()}`, { cache: "no-store" });
  } catch {
    throw new Error("Нет связи с GitHub");
  }
  if (response.status === 404) throw new Error("Файл не найден — проверь ссылку и что репозиторий публичный");
  if (!response.ok) throw new Error(`GitHub ответил ошибкой ${response.status}`);
  return parseSetFile(await response.text(), getTitleFromUrl(rawUrl));
}
