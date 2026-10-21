/**
 * Аудио уроков на телефоне — отдельное хранилище Cache API. Ключ — полная ссылка на файл, та же, что у урока:
 * по ней Service Worker отдаёт файл плееру без сети (правило lesson-audio в vite.config.ts). Автоматического
 * вытеснения нет: скачанный курс не должен тихо пропадать. Лишнее стирает только уборка.
 */
export const AUDIO_CACHE = "lesson-audio";

function openCache() {
  return caches.open(AUDIO_CACHE);
}

/** Есть ли Cache API: его нет на http-страницах (кроме localhost) и в очень старых браузерах. */
export function canStoreAudio() {
  return typeof caches !== "undefined";
}

/** Скачанные файлы: ссылка → размер в байтах. */
export async function readStoredAudio(): Promise<Map<string, number>> {
  const cache = await openCache();
  const stored = new Map<string, number>();
  for (const request of await cache.keys()) {
    const response = await cache.match(request);
    const length = Number(response?.headers.get("content-length"));
    stored.set(request.url, Number.isFinite(length) && length > 0 ? length : ((await response?.blob())?.size ?? 0));
  }
  return stored;
}

/** Размер файла до скачивания — по заголовку. null — сайт не сказал или нет сети. */
export async function probeAudioSize(url: string): Promise<number | null> {
  try {
    const response = await fetch(url, { method: "HEAD", mode: "cors", cache: "no-store" });
    const length = Number(response.headers.get("content-length"));
    return response.ok && length > 0 ? length : null;
  } catch {
    return null;
  }
}

/**
 * Скачивает файл целиком и только потом кладёт в хранилище: оборванная загрузка не оставляет половинок.
 * Сохраняем без лишних заголовков: GitHub отдаёт Vary, и сохранённый с ним ответ плеер мог бы потом не найти.
 */
export async function downloadAudio(url: string, onBytes: (bytes: number) => void): Promise<number> {
  const response = await fetch(url, { mode: "cors", cache: "no-store" });
  if (!response.ok || !response.body) throw new Error(`сайт ответил ${response.status}`);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.length;
    onBytes(value.length);
  }
  const type = response.headers.get("content-type") || "audio/mpeg";
  const body = new Blob(chunks as BlobPart[], { type });
  await (await openCache()).put(
    url,
    new Response(body, { status: 200, headers: { "Content-Type": type, "Content-Length": String(body.size) } }),
  );
  return size;
}

export async function deleteAudio(urls: Iterable<string>) {
  const cache = await openCache();
  await Promise.all([...urls].map((url) => cache.delete(url)));
}
