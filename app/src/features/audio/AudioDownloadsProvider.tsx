import { createContext, use, useEffect, useRef, useState, type ReactNode } from "react";
import { useSets } from "../sets/SetsProvider";
import type { SetRecord } from "../sets/setsStore";
import { canStoreAudio, deleteAudio, downloadAudio, probeAudioSize, readStoredAudio } from "./audioCache";

/** Загрузка аудио курса на телефон: сколько уже скачано и что пошло не так. */
export interface AudioJob {
  running: boolean;
  /** Байт скачано и всего; total null — размер неизвестен (сайт не сказал). */
  loaded: number;
  total: number | null;
  filesDone: number;
  files: number;
  error?: string;
}

/** Аудио одного курса на телефоне. */
export interface CourseAudio {
  /** Все файлы озвучки курса, без повторов. */
  urls: string[];
  storedCount: number;
  storedBytes: number;
  /** Сколько ещё скачивать; null — размер ещё не узнали. */
  missingBytes: number | null;
  job: AudioJob | undefined;
}

interface AudioDownloadsValue {
  /** Можно ли вообще хранить аудио на телефоне. */
  available: boolean;
  isStored: (url: string) => boolean;
  getCourseAudio: (setId: string) => CourseAudio;
  /** Узнать размер нескачанных файлов курса — для кнопки «Скачать аудио · 85 МБ». */
  probeCourse: (setId: string) => void;
  download: (setId: string) => void;
  /** «Удалить аудио»: файлы курса, кроме тех, на которые ссылается другой набор. */
  removeCourseAudio: (setId: string) => void;
  /** Всё аудио на телефоне, байт. */
  totalBytes: number;
}

const AudioDownloadsContext = createContext<AudioDownloadsValue | null>(null);

function getAudioUrls(record: SetRecord | undefined) {
  return [...new Set((record?.file.lessons ?? []).flatMap((l) => (l.audio ? [l.audio] : [])))];
}

/** Ошибка загрузки — по-человечески: без сети, без места или ответ сайта. */
function describeError(error: unknown, done: number, files: number) {
  if (error instanceof DOMException && error.name === "QuotaExceededError") {
    return "Не хватает места на телефоне — освободи место или удали аудио других курсов.";
  }
  const progress = done ? ` Скачано ${done} из ${files} — нажми ещё раз, докачаю остальное.` : "";
  if (!navigator.onLine) return `Нет сети.${progress}`;
  return `Не удалось скачать: ${error instanceof Error ? error.message : "неизвестная ошибка"}.${progress}`;
}

/**
 * Аудио курсов на телефоне: что скачано, загрузка с прогрессом, удаление и уборка. Живёт над экранами — ушёл из
 * оглавления, а загрузка продолжается. Уборка стирает аудио, на которое не ссылается ни один набор: после удаления
 * и обновления набора, после оборванной загрузки и при каждом запуске.
 */
export function AudioDownloadsProvider({ children }: { children: ReactNode }) {
  const { sets, loaded, persistent } = useSets();
  const available = canStoreAudio();
  const [stored, setStored] = useState<Map<string, number> | null>(null);
  const [sizes, setSizes] = useState<Map<string, number | null>>(new Map());
  const [jobs, setJobs] = useState<Map<string, AudioJob>>(new Map());
  const setsRef = useRef(sets);
  const storedRef = useRef(stored);
  const sizesRef = useRef(sizes);
  const running = useRef(new Set<string>());

  useEffect(() => {
    setsRef.current = sets;
    storedRef.current = stored;
    sizesRef.current = sizes;
  });

  useEffect(() => {
    if (!available) return;
    readStoredAudio().then(setStored, () => setStored(new Map()));
  }, [available]);

  // Уборка. Ждём, пока список наборов прочитан с устройства: до этого он пуст не потому, что наборов нет.
  useEffect(() => {
    if (!available || !loaded || !persistent || !stored) return;
    const referenced = new Set(sets.flatMap((record) => getAudioUrls(record)));
    const extra = [...stored.keys()].filter((url) => !referenced.has(url));
    if (!extra.length) return;
    deleteAudio(extra).then(
      () =>
        setStored((prev) => {
          const next = new Map(prev);
          extra.forEach((url) => next.delete(url));
          return next;
        }),
      () => undefined,
    );
  }, [available, loaded, persistent, sets, stored]);

  function patchJob(setId: string, change: Partial<AudioJob> | null) {
    setJobs((prev) => {
      const next = new Map(prev);
      if (!change) next.delete(setId);
      else next.set(setId, { ...(prev.get(setId) ?? { running: false, loaded: 0, total: null, filesDone: 0, files: 0 }), ...change });
      return next;
    });
  }

  function getCourseAudio(setId: string): CourseAudio {
    const urls = getAudioUrls(sets.find((s) => s.id === setId));
    const storedUrls = urls.filter((url) => stored?.has(url));
    const missing = urls.filter((url) => !stored?.has(url));
    const missingSizes = missing.map((url) => sizes.get(url));
    return {
      urls,
      storedCount: storedUrls.length,
      storedBytes: storedUrls.reduce((sum, url) => sum + (stored?.get(url) ?? 0), 0),
      missingBytes: missingSizes.every((size) => typeof size === "number") ? missingSizes.reduce<number>((a, b) => a + (b ?? 0), 0) : null,
      job: jobs.get(setId),
    };
  }

  function probeCourse(setId: string) {
    const urls = getAudioUrls(setsRef.current.find((s) => s.id === setId)).filter(
      (url) => !storedRef.current?.has(url) && !sizesRef.current.has(url),
    );
    if (!urls.length || !navigator.onLine) return;
    // Отмечаем сразу, чтобы второе открытие оглавления не спросило те же файлы ещё раз.
    setSizes((prev) => new Map([...prev, ...urls.map((url) => [url, null] as const)]));
    Promise.all(urls.map(async (url) => [url, await probeAudioSize(url)] as const)).then((found) =>
      setSizes((prev) => new Map([...prev, ...found])),
    );
  }

  async function download(setId: string) {
    if (!available || running.current.has(setId)) return;
    running.current.add(setId);
    // Скачанное не должно пропасть, когда телефону понадобится место.
    navigator.storage?.persist?.().catch(() => undefined);
    const urls = getAudioUrls(setsRef.current.find((s) => s.id === setId)).filter((url) => !storedRef.current?.has(url));
    const known = urls.map((url) => sizesRef.current.get(url));
    const total = known.every((size) => typeof size === "number") ? known.reduce<number>((a, b) => a + (b ?? 0), 0) : null;
    patchJob(setId, { running: true, loaded: 0, total, filesDone: 0, files: urls.length, error: undefined });
    let done = 0;
    try {
      for (const url of urls) {
        // Набор удалили или обновили посреди загрузки — его файлы больше не качаем.
        if (!getAudioUrls(setsRef.current.find((s) => s.id === setId)).includes(url)) continue;
        const size = await downloadAudio(url, (bytes) =>
          setJobs((prev) => {
            const job = prev.get(setId);
            return job ? new Map(prev).set(setId, { ...job, loaded: job.loaded + bytes }) : prev;
          }),
        );
        done++;
        setStored((prev) => new Map(prev).set(url, size));
        patchJob(setId, { filesDone: done });
      }
      patchJob(setId, null);
    } catch (error) {
      patchJob(setId, { running: false, error: describeError(error, done, urls.length) });
    } finally {
      running.current.delete(setId);
    }
  }

  function removeCourseAudio(setId: string) {
    const others = new Set(setsRef.current.filter((s) => s.id !== setId).flatMap((record) => getAudioUrls(record)));
    const urls = getAudioUrls(setsRef.current.find((s) => s.id === setId)).filter((url) => !others.has(url));
    deleteAudio(urls).then(
      () =>
        setStored((prev) => {
          const next = new Map(prev);
          urls.forEach((url) => next.delete(url));
          return next;
        }),
      () => undefined,
    );
    patchJob(setId, null);
  }

  const totalBytes = [...(stored?.values() ?? [])].reduce((a, b) => a + b, 0);

  return (
    <AudioDownloadsContext
      value={{
        available,
        isStored: (url) => !!stored?.has(url),
        getCourseAudio,
        probeCourse,
        download,
        removeCourseAudio,
        totalBytes,
      }}
    >
      {children}
    </AudioDownloadsContext>
  );
}

export function useAudioDownloads() {
  const value = use(AudioDownloadsContext);
  if (!value) throw new Error("useAudioDownloads вызван вне AudioDownloadsProvider");
  return value;
}

/** «85 МБ», «4,6 МБ», «640 КБ». */
export function formatBytes(bytes: number) {
  const mb = bytes / 1048576;
  if (mb >= 10) return `${Math.round(mb)} МБ`;
  if (mb >= 1) return `${mb.toFixed(1).replace(".", ",")} МБ`;
  return `${Math.max(1, Math.round(bytes / 1024))} КБ`;
}
