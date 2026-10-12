/**
 * Ссылка на файл набора → ссылка на сырой файл, который можно скачать из браузера.
 * Принимаем только GitHub: у сырых файлов GitHub и Gist открыт CORS, у других сайтов — как повезёт.
 */
export function toRawGithubUrl(input: string): string {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new Error("Это не похоже на ссылку");
  }
  if (url.protocol !== "https:") throw new Error("Нужна ссылка, которая начинается с https://");
  const parts = url.pathname.split("/").filter(Boolean);

  switch (url.hostname) {
    case "raw.githubusercontent.com":
    case "gist.githubusercontent.com":
      return `https://${url.hostname}/${parts.join("/")}`;

    case "github.com": {
      // github.com/<владелец>/<репозиторий>/blob/<ветка>/<путь к файлу>
      const [owner, repo, kind, ...rest] = parts;
      if ((kind === "blob" || kind === "raw") && rest.length >= 2) {
        return `https://raw.githubusercontent.com/${owner}/${repo}/${rest.join("/")}`;
      }
      throw new Error("Нужна ссылка на сам файл: открой YAML-файл на GitHub и скопируй адрес страницы");
    }

    case "gist.github.com": {
      // Сырой текст gist без указания файла — его первый файл.
      const [user, id] = parts;
      if (user && id) return `https://gist.githubusercontent.com/${user}/${id}/raw`;
      throw new Error("Нужна ссылка на конкретный gist");
    }

    default:
      throw new Error("Поддерживаются только ссылки на GitHub");
  }
}

/** Название набора по умолчанию — имя файла без расширения. */
export function getTitleFromUrl(rawUrl: string) {
  const last = new URL(rawUrl).pathname.split("/").filter(Boolean).pop() ?? "";
  const name = decodeURIComponent(last).replace(/\.ya?ml$/i, "");
  return name && name !== "raw" ? name : "Набор вопросов";
}
