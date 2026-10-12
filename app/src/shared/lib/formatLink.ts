/** Короткая подпись ссылки: "developer.mozilla.org › Microtask_guide". */
export function formatLink(url: string) {
  try {
    const { hostname, pathname } = new URL(url);
    const host = hostname.replace(/^www\./, "");
    const last = pathname.split("/").filter(Boolean).pop();
    return last ? `${host} › ${decodeURIComponent(last)}` : host;
  } catch {
    return url;
  }
}
