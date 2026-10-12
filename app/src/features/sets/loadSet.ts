import { parseSetFile, type ParsedSet } from "./parseSet";
import { getTitleFromUrl } from "./setUrl";

/** Скачивает и разбирает файл набора по ссылке на сырой файл. */
export async function fetchSet(rawUrl: string): Promise<ParsedSet> {
  let response: Response;
  try {
    // Метка времени — чтобы кэш сайта не отдал старую версию файла.
    response = await fetch(`${rawUrl}${rawUrl.includes("?") ? "&" : "?"}t=${Date.now()}`, { cache: "no-store" });
  } catch {
    // Браузер не говорит, что именно случилось: нет сети или сайт запретил чтение с других сайтов (CORS).
    throw new Error(
      "Не удалось скачать файл: нет связи или сайт не разрешает загрузку с других сайтов. " +
        "Скачай файл и добавь его через «Загрузить файл с устройства».",
    );
  }
  if (response.status === 404) throw new Error("Файл не найден — проверь ссылку и что файл доступен без входа");
  if (!response.ok) throw new Error(`Сайт ответил ошибкой ${response.status}`);

  const text = await response.text();
  // Частая ошибка — ссылка на страницу с файлом, а не на сам файл.
  if ((response.headers.get("content-type") ?? "").includes("text/html") || /^\s*<(!doctype|html)/i.test(text)) {
    throw new Error("По ссылке пришла веб-страница, а не файл. Нужна ссылка на сам файл — обычно кнопка Raw");
  }
  return parseSetFile(text, getTitleFromUrl(rawUrl));
}
