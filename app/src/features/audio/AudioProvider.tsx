import { createContext, use, useEffect, useRef, useState, type ReactNode } from "react";
import { readStorage, writeStorage } from "../../shared/lib/storage";
import { useLessons } from "../lessons/LessonsProvider";

/** Что играет: озвучка одного урока. */
export interface AudioTrack {
  setId: string;
  lessonId: string;
  /** Полная https-ссылка на аудиофайл. */
  src: string;
  /** Название урока — в плеере и на экране блокировки. */
  title: string;
  /** Название курса — вторая строка на экране блокировки. */
  course: string;
}

interface AudioState {
  track: AudioTrack | null;
  playing: boolean;
  /** Текущая секунда и длина файла (0, пока длина неизвестна). */
  time: number;
  duration: number;
  rate: number;
  /** Урок дослушан до конца. */
  ended: boolean;
  /** Файл не загрузился. */
  error: boolean;
}

interface AudioContextValue extends AudioState {
  /** Играть урок: тот же — продолжить, другой — с места, где его бросили. */
  play: (track: AudioTrack) => void;
  pause: () => void;
  seekBy: (seconds: number) => void;
  seekTo: (seconds: number) => void;
  /** Скорость из меню плеера. Запоминается на устройстве. */
  setRate: (rate: number) => void;
  /** Выключить плеер: остановить и запомнить место. */
  close: () => void;
}

export const AUDIO_RATES = [0.75, 1, 1.25, 1.5, 2] as const;
const RATE_KEY = "fq.audioRate";
/** Как часто запоминать место, пока играет: Android может выгрузить свёрнутое приложение в любой момент. */
const SAVE_EVERY = 5;
/** На сколько секунд перематывают кнопки и экран блокировки. */
export const SKIP_SECONDS = 15;

const AudioContext = createContext<AudioContextValue | null>(null);

function readRate() {
  const saved = Number(readStorage(RATE_KEY));
  return (AUDIO_RATES as readonly number[]).includes(saved) ? saved : 1;
}

const EMPTY: AudioState = { track: null, playing: false, time: 0, duration: 0, rate: 1, ended: false, error: false };

/**
 * Плеер озвучки уроков — один на всё приложение и живёт над экранами: человек ушёл из урока в оглавление или на
 * главную — звук продолжается. Обычный `<audio>`, а не Web Audio: его браузер не усыпляет при выключенном экране.
 * Экран блокировки и шторка — Media Session; место в уроке пишется в прогресс курса.
 */
export function AudioProvider({ children }: { children: ReactNode }) {
  const { getCourse, updateCourse } = useLessons();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [state, setState] = useState<AudioState>(() => ({ ...EMPTY, rate: readRate() }));
  const trackRef = useRef<AudioTrack | null>(null);
  // Ссылки на свежие функции контекста уроков: обработчики событий плеера вешаются один раз.
  const lessonsRef = useRef({ getCourse, updateCourse });
  useEffect(() => {
    lessonsRef.current = { getCourse, updateCourse };
  });
  const lastSaved = useRef(0);
  const pendingSeek = useRef<number | null>(null);

  function patch(change: Partial<AudioState>) {
    setState((prev) => ({ ...prev, ...change }));
  }

  /** Запомнить место в уроке; null — дослушан, в следующий раз с начала. */
  function savePosition(seconds: number | null) {
    const track = trackRef.current;
    if (!track) return;
    lastSaved.current = seconds ?? 0;
    lessonsRef.current.updateCourse(track.setId, { audio: { lessonId: track.lessonId, seconds } });
  }

  /**
   * Полоса прогресса в шторке живёт по подсказкам страницы: телефон сам досчитывает время от последней переданной
   * позиции. Поэтому позицию и состояние сообщаем при каждом старте, паузе, перемотке и смене скорости — иначе
   * полоса убегает вперёд или застывает (найдено на проверке перед разработкой).
   */
  function syncMediaSession() {
    const audio = audioRef.current;
    if (!audio || !("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = audio.paused ? "paused" : "playing";
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: audio.duration,
        position: Math.min(audio.currentTime, audio.duration),
        playbackRate: audio.playbackRate,
      });
    } catch {
      // Старые браузеры без позиции — шторка просто без полосы.
    }
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => {
      patch({ playing: true, ended: false, error: false });
      syncMediaSession();
    };
    // Ноль не записываем: так браузер сообщает о паузе, когда сменили урок, и о старте до перемотки к сохранённому.
    const canSave = () => !audio.ended && audio.currentTime > 0 && pendingSeek.current === null;
    const onPause = () => {
      patch({ playing: false });
      if (canSave()) savePosition(audio.currentTime);
      syncMediaSession();
    };
    const onTime = () => {
      patch({ time: audio.currentTime });
      if (!audio.paused && canSave() && Math.abs(audio.currentTime - lastSaved.current) >= SAVE_EVERY) {
        savePosition(audio.currentTime);
      }
    };
    const onMeta = () => {
      if (pendingSeek.current !== null) {
        // Почти дослушанный урок начинаем заново: иначе он кончится через секунду.
        if (pendingSeek.current < audio.duration - 3) audio.currentTime = pendingSeek.current;
        pendingSeek.current = null;
      }
      patch({ duration: audio.duration, time: audio.currentTime });
      syncMediaSession();
    };
    // Урок дослушан — тишина: человек может сразу пойти к вопросам. Место сбрасываем на начало.
    const onEnded = () => {
      patch({ playing: false, ended: true, time: audio.duration });
      savePosition(null);
      syncMediaSession();
    };
    const onError = () => patch({ playing: false, error: true });
    const onSync = () => syncMediaSession();
    // Свернули приложение — запомнить место сразу, не дожидаясь пяти секунд.
    const onHide = () => {
      if (document.hidden && trackRef.current && canSave()) savePosition(audio.currentTime);
    };
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    audio.addEventListener("seeked", onSync);
    audio.addEventListener("ratechange", onSync);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("seeked", onSync);
      audio.removeEventListener("ratechange", onSync);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

  function seekTo(seconds: number) {
    const audio = audioRef.current;
    if (!audio || !trackRef.current) return;
    const max = Number.isFinite(audio.duration) ? audio.duration : seconds;
    audio.currentTime = Math.max(0, Math.min(seconds, max));
    patch({ time: audio.currentTime, ended: false });
  }

  function seekBy(seconds: number) {
    const audio = audioRef.current;
    if (audio) seekTo(audio.currentTime + seconds);
  }

  function pause() {
    audioRef.current?.pause();
  }

  // Кнопки экрана блокировки: пауза, ±15 секунд и перемотка ползунком.
  function setupMediaSession(track: AudioTrack) {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.course,
      album: "Zubrilka",
      artwork: [{ src: `${import.meta.env.BASE_URL}icons/icon-512.png`, sizes: "512x512", type: "image/png" }],
    });
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play", () => void audioRef.current?.play()],
      ["pause", () => audioRef.current?.pause()],
      ["seekbackward", () => seekBy(-SKIP_SECONDS)],
      ["seekforward", () => seekBy(SKIP_SECONDS)],
      ["seekto", (details) => details.seekTime !== undefined && seekTo(details.seekTime)],
    ];
    for (const [action, handler] of handlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Действие не поддерживается — просто без этой кнопки.
      }
    }
  }

  function play(track: AudioTrack) {
    const audio = audioRef.current;
    if (!audio) return;
    const current = trackRef.current;
    if (!current || current.src !== track.src || current.setId !== track.setId || current.lessonId !== track.lessonId) {
      if (current && !audio.paused) savePosition(audio.currentTime);
      trackRef.current = track;
      const saved = lessonsRef.current.getCourse(track.setId)?.audio?.[track.lessonId] ?? 0;
      pendingSeek.current = saved > 0 ? saved : null;
      lastSaved.current = saved;
      audio.src = track.src;
      setState((prev) => ({ ...EMPTY, rate: prev.rate, track, time: saved }));
    } else if (audio.error) {
      // Файл не загрузился (не было сети) — грузим заново; место, с которого начинали, ещё ждёт в pendingSeek.
      audio.src = track.src;
      patch({ error: false });
    } else if (audio.ended) {
      audio.currentTime = 0;
    }
    audio.playbackRate = state.rate;
    setupMediaSession(track);
    // play() — прямо в обработчике нажатия: иначе браузер посчитает звук автозапуском и не даст играть.
    audio.play().catch(() => patch({ playing: false }));
  }

  function setRate(rate: number) {
    if (audioRef.current) audioRef.current.playbackRate = rate;
    writeStorage(RATE_KEY, String(rate));
    patch({ rate });
  }

  function close() {
    const audio = audioRef.current;
    if (!audio) return;
    if (trackRef.current && !audio.ended && audio.currentTime > 0) savePosition(audio.currentTime);
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    trackRef.current = null;
    pendingSeek.current = null;
    setState((prev) => ({ ...EMPTY, rate: prev.rate }));
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = "none";
    }
  }

  return (
    <AudioContext value={{ ...state, play, pause, seekBy, seekTo, setRate, close }}>
      {children}
      {/* Без controls браузер его не показывает; управление — в плеере (AudioPlayer) и на экране блокировки. */}
      <audio ref={audioRef} preload="metadata" />
    </AudioContext>
  );
}

export function useAudio() {
  const value = use(AudioContext);
  if (!value) throw new Error("useAudio вызван вне AudioProvider");
  return value;
}

/** «3:07» или «1:02:45». */
export function formatAudioTime(seconds: number) {
  const total = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}
