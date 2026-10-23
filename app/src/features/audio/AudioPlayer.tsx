import clsx from "clsx";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { Button, IconButton } from "../../shared/ui/Button";
import { useDockSlot } from "../../shared/ui/dockSlot";
import { Icon } from "../../shared/ui/Icon";
import { useAudioDownloads } from "./AudioDownloadsProvider";
import { AUDIO_RATES, formatAudioTime, SKIP_SECONDS, useAudio, type AudioTrack } from "./AudioProvider";
import styles from "./AudioPlayer.module.css";

/** Что плеер знает об играющем уроке из его курса. */
export interface PlayingLesson {
  /** Номер урока в курсе, с единицы. */
  number: number;
  /** У урока есть вопросы — после конца предлагаем к ним. */
  hasQuestions: boolean;
  /** Урок открыт на экране — заголовок не ссылка на него. */
  onLessonPage: boolean;
  /** Следующий урок курса, если у него есть озвучка. */
  next: AudioTrack | null;
}

interface AudioPlayerProps {
  lesson: PlayingLesson | null;
  onOpenLesson: (setId: string, lessonId: string) => void;
  onOpenQuestions: (setId: string, lessonId: string) => void;
  /** «Урок N+1» после конца: включить следующий урок. */
  onPlayNext: (track: AudioTrack) => void;
}

/** «1,25×» — запятая, как пишут дроби по-русски. */
function formatRate(rate: number) {
  return `${String(rate).replace(".", ",")}×`;
}

/** Сколько осталось: «−8:28»; дослушан — «0:00» без минуса; длина ещё неизвестна — «…». */
function remaining(duration: number, time: number) {
  if (!duration) return "…";
  const left = Math.max(0, duration - time);
  return left < 1 ? formatAudioTime(0) : `−${formatAudioTime(left)}`;
}

/** Насколько сдвинуть шторку пальцем вниз, чтобы она свернулась. */
const SWIPE_TO_COLLAPSE = 80;

/**
 * Плеер озвучки, пока выбран урок, — на любом экране. Свёрнутый — круглый значок с кольцом прогресса в правом нижнем
 * углу над зоной системного жеста; на экране с нижней панелью — над ней и над «Почему?» (место из dockSlot).
 * Нажатие разворачивает большой плеер на шторке; свернуть — кнопкой, свайпом вниз или нажатием мимо.
 * Кнопка «свернуть» в ряду управления стоит ровно там, где был значок: открыл и закрыл одним местом.
 */
export function AudioPlayer({ lesson, onOpenLesson, onOpenQuestions, onPlayNext }: AudioPlayerProps) {
  const audio = useAudio();
  const { isStored } = useAudioDownloads();
  const slot = useDockSlot();
  const [open, setOpen] = useState(false);
  const { track } = audio;

  // Запас под значком внизу экрана, чтобы последний абзац урока не прятался под ним.
  useEffect(() => {
    if (!track) return;
    const root = document.documentElement;
    root.style.setProperty("--audio-bar", "calc(var(--player-lift) + 72px)");
    return () => {
      root.style.removeProperty("--audio-bar");
    };
  }, [!track]);

  // Плеер выключили (или удалили набор) — шторку тоже.
  useEffect(() => {
    if (!track) setOpen(false);
  }, [track]);

  if (!track) return null;
  const duration = audio.duration || 0;
  const progress = audio.ended ? 1 : duration ? Math.min(audio.time / duration, 1) : 0;

  const mini = (
    <button
      type="button"
      className={clsx(styles.mini, slot && styles.inSlot)}
      style={{ "--progress": `${progress * 360}deg` } as CSSProperties}
      aria-label={`Плеер урока «${track.title}»: ${audio.error ? "ошибка" : audio.playing ? "играет" : "пауза"}`}
      aria-haspopup="dialog"
      onClick={() => setOpen(true)}
    >
      <span className={styles.miniInner}>
        {/* Значок всегда один: играет — полоски прыгают цветом ссылок, пауза — застыли и приглушены. */}
        <span className={clsx(styles.equalizer, !audio.playing && styles.equalizerPaused)} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </span>
      {audio.error && <span className={styles.dot} aria-hidden="true" />}
    </button>
  );

  return (
    <>
      {slot ? createPortal(mini, slot) : mini}
      <PlayerSheet
        open={open}
        lesson={lesson}
        offlineMissing={audio.error && !navigator.onLine && !isStored(track.src)}
        onCollapse={() => setOpen(false)}
        onOpenLesson={() => {
          setOpen(false);
          onOpenLesson(track.setId, track.lessonId);
        }}
        onOpenQuestions={() => {
          setOpen(false);
          onOpenQuestions(track.setId, track.lessonId);
        }}
        onPlayNext={onPlayNext}
      />
    </>
  );
}

interface PlayerSheetProps {
  open: boolean;
  lesson: PlayingLesson | null;
  offlineMissing: boolean;
  onCollapse: () => void;
  onOpenLesson: () => void;
  onOpenQuestions: () => void;
  onPlayNext: (track: AudioTrack) => void;
}

/** Большой плеер — шторка снизу на <dialog>: фокус внутри и Esc браузер обеспечивает сам. */
function PlayerSheet({ open, lesson, offlineMissing, onCollapse, onOpenLesson, onOpenQuestions, onPlayNext }: PlayerSheetProps) {
  const audio = useAudio();
  const ref = useRef<HTMLDialogElement>(null);
  const drag = useRef<{ start: number; shift: number } | null>(null);
  const [rateMenu, setRateMenu] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (!open) setRateMenu(false);
  }, [open]);

  // Свайп вниз за любое место шторки, кроме кнопок и ползунка, — свернуть.
  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("button, input")) return;
    drag.current = { start: e.clientY, shift: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    drag.current.shift = Math.max(0, e.clientY - drag.current.start);
    e.currentTarget.style.transform = `translateY(${drag.current.shift}px)`;
  }
  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    const collapse = drag.current.shift > SWIPE_TO_COLLAPSE;
    drag.current = null;
    e.currentTarget.style.transform = "";
    if (collapse) onCollapse();
  }

  const track = audio.track;
  const duration = audio.duration || 0;
  const heading = lesson ? `Урок ${lesson.number} · ${track?.course ?? ""}` : (track?.course ?? "");
  const status = audio.error
    ? offlineMissing
      ? "Нет сети, а аудио этого урока не скачано"
      : "Не удалось загрузить аудио — проверь связь"
    : null;

  const fold = (
    <button type="button" className={styles.fold} aria-label="Свернуть плеер" onClick={onCollapse}>
      <Icon name="chevronDown" />
    </button>
  );

  return (
    <dialog
      ref={ref}
      className={styles.sheet}
      aria-label="Плеер урока"
      onClose={onCollapse}
      // Клик по затемнению вокруг шторки приходит в сам <dialog>.
      onClick={(e) => e.target === e.currentTarget && onCollapse()}
    >
      {open && track && (
        <div
          className={styles.panel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <span className={styles.handle} aria-hidden="true" />
          <div className={styles.head}>
            {lesson && !lesson.onLessonPage ? (
              <button type="button" className={styles.lessonLink} onClick={onOpenLesson}>
                <span>{heading}</span>
                <Icon name="chevronRight" />
              </button>
            ) : (
              <span className={styles.course}>{heading}</span>
            )}
            <span className={styles.windowButtons}>
              <IconButton icon="chevronDown" label="Свернуть" onClick={onCollapse} />
              <IconButton
                icon="close"
                label="Выключить плеер"
                onClick={() => {
                  onCollapse();
                  audio.close();
                }}
              />
            </span>
          </div>

          <div className={styles.titleBlock}>
            <h2 className={styles.title}>{track.title}</h2>
            {audio.ended && (
              <span className={styles.done}>
                <Icon name="check" />
                Урок дослушан
              </span>
            )}
            {status && <span className={styles.error}>{status}</span>}
          </div>

          <div className={styles.seek}>
            <input
              className={styles.range}
              type="range"
              min={0}
              max={duration || 1}
              step={1}
              value={Math.min(audio.time, duration || 1)}
              disabled={!duration}
              style={{ "--fill": `${duration ? (Math.min(audio.time, duration) / duration) * 100 : 0}%` } as CSSProperties}
              aria-label="Перемотка"
              aria-valuetext={formatAudioTime(audio.time)}
              onChange={(e) => audio.seekTo(Number(e.target.value))}
            />
            <div className={styles.times}>
              <span>{formatAudioTime(audio.time)}</span>
              <span>{remaining(duration, audio.time)}</span>
            </div>
          </div>

          {audio.ended ? (
            <>
              {lesson?.hasQuestions && (
                <Button iconAfter="arrowRight" className={styles.toQuestions} onClick={onOpenQuestions}>
                  К вопросам урока
                </Button>
              )}
              <div className={styles.endRow}>
                <Button variant="secondary" icon="replay" onClick={() => audio.play(track)}>
                  Заново
                </Button>
                {lesson?.next && (
                  <Button variant="secondary" iconAfter="arrowRight" onClick={() => onPlayNext(lesson.next!)}>
                    Урок {lesson.number + 1}
                  </Button>
                )}
                {fold}
              </div>
            </>
          ) : (
            <div className={styles.controls}>
              <div className={styles.rateBox}>
                <button
                  type="button"
                  className={styles.rate}
                  aria-label={`Скорость ${formatRate(audio.rate)}`}
                  aria-haspopup="menu"
                  aria-expanded={rateMenu}
                  onClick={() => setRateMenu((v) => !v)}
                >
                  {formatRate(audio.rate)}
                </button>
                {rateMenu && (
                  <div className={styles.rateMenu} role="menu" aria-label="Скорость">
                    {AUDIO_RATES.map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        role="menuitemradio"
                        aria-checked={rate === audio.rate}
                        className={clsx(styles.rateItem, rate === audio.rate && styles.rateCurrent)}
                        onClick={() => {
                          audio.setRate(rate);
                          setRateMenu(false);
                        }}
                      >
                        {formatRate(rate)}
                        {rate === audio.rate && <Icon name="check" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                className={styles.skip}
                aria-label={`−${SKIP_SECONDS} секунд`}
                onClick={() => audio.seekBy(-SKIP_SECONDS)}
              >
                <Icon name="back15" />
              </button>
              <button
                type="button"
                className={styles.play}
                aria-label={audio.playing ? "Пауза" : "Слушать"}
                onClick={() => (audio.playing ? audio.pause() : audio.play(track))}
              >
                <Icon name={audio.playing ? "pause" : "play"} />
              </button>
              <button
                type="button"
                className={styles.skip}
                aria-label={`+${SKIP_SECONDS} секунд`}
                onClick={() => audio.seekBy(SKIP_SECONDS)}
              >
                <Icon name="fwd15" />
              </button>
              {fold}
            </div>
          )}
          {/* Меню скоростей открыто — нажатие мимо него закрывает только меню, а не шторку. */}
          {rateMenu && <div className={styles.menuShade} onClick={() => setRateMenu(false)} />}
        </div>
      )}
    </dialog>
  );
}
