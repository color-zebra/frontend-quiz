/**
 * Ссылка на файл набора → ссылка, по которой браузер скачает сам YAML-текст.
 * Подходит любой https-адрес. Для GitHub и Gist ссылку на страницу файла переделываем в ссылку на сырой файл.
 * Скачается ли файл, решает сайт: он должен разрешать чтение с других сайтов (CORS).
 */
export function toRawUrl(input: string): string {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new Error("Это не похоже на ссылку");
  }
  if (url.protocol === "http:") {
    throw new Error("Нужна ссылка с https:// — по http браузер не загрузит файл на защищённой странице");
  }
  if (url.protocol !== "https:") throw new Error("Нужна ссылка, которая начинается с https://");
  const parts = url.pathname.split("/").filter(Boolean);

  if (url.hostname === "github.com") {
    // github.com/<владелец>/<репозиторий>/blob/<ветка>/<путь к файлу>
    const [owner, repo, kind, ...rest] = parts;
    if ((kind === "blob" || kind === "raw") && rest.length >= 2) {
      return `https://raw.githubusercontent.com/${owner}/${repo}/${rest.join("/")}`;
    }
    throw new Error("Нужна ссылка на сам файл: открой YAML-файл на GitHub и скопируй адрес страницы");
  }

  if (url.hostname === "gist.github.com") {
    // Сырой текст gist без указания файла — его первый файл.
    const [user, id] = parts;
    if (user && id) return `https://gist.githubusercontent.com/${user}/${id}/raw`;
    throw new Error("Нужна ссылка на конкретный gist");
  }

  return url.href;
}

/** Название набора по умолчанию — имя файла без расширения. */
export function getTitleFromUrl(rawUrl: string) {
  const last = new URL(rawUrl).pathname.split("/").filter(Boolean).pop() ?? "";
  const name = decodeURIComponent(last).replace(/\.ya?ml$/i, "");
  return name && name !== "raw" ? name : "Набор вопросов";
}
