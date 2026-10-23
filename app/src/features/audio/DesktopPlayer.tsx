import clsx from "clsx";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { IconButton } from "../../shared/ui/Button";
import { Icon } from "../../shared/ui/Icon";
import { AUDIO_RATES, formatAudioTime, SKIP_SECONDS, useAudio } from "./AudioProvider";
import styles from "./DesktopPlayer.module.css";

/**
 * Плеер озвучки на десктопе — карточкой внизу бокового меню (в уроке — под оглавлением курса). Всё главное
 * под рукой: название урока (щелчок — открыть урок), перемотка по полосе во всю ширину, ±15 секунд, пауза,
 * скорость. Шторки большого плеера на десктопе нет.
 */
export function DesktopPlayer({ onOpenLesson }: { onOpenLesson: (setId: string, lessonId: string) => void }) {
  const audio = useAudio();
  const { track } = audio;
  if (!track) return null;
  const duration = audio.duration || 0;
  const time = audio.ended ? duration : audio.time;
  const share = duration ? Math.min(time / duration, 1) : 0;
  const nextRate = AUDIO_RATES[(AUDIO_RATES.indexOf(audio.rate as (typeof AUDIO_RATES)[number]) + 1) % AUDIO_RATES.length];

  return (
    <section className={styles.player} aria-label="Плеер озвучки">
      <div className={styles.head}>
        {/* Название — ссылка на урок: цветом ссылок и со стрелкой, под курсором подчёркнуто. */}
        <button type="button" className={styles.title} title="Открыть урок" onClick={() => onOpenLesson(track.setId, track.lessonId)}>
          <b>
            {track.title}
            <Icon name="chevronRight" />
          </b>
          <span>{audio.error ? "Не удалось загрузить звук" : track.course}</span>
        </button>
        <IconButton icon="close" label="Закрыть плеер" bare className={styles.small} onClick={audio.close} />
      </div>
      <div className={styles.time}>
        <input
          type="range"
          className={styles.range}
          min={0}
          max={duration || 1}
          step={1}
          value={Math.min(time, duration || 1)}
          style={{ "--share": `${share * 100}%` } as CSSProperties}
          aria-label="Перемотка"
          onChange={(e) => audio.seekTo(Number(e.target.value))}
        />
        <span className={styles.times}>
          <span>{formatAudioTime(time)}</span>
          <span>{formatAudioTime(duration)}</span>
        </span>
      </div>
      {/* «1×» · «−15» · «Пауза» · «+15» · громкость: по краям плашки одной ширины, пауза — ровно посередине. */}
      <div className={styles.controls}>
        <button type="button" className={styles.rate} title="Скорость" onClick={() => audio.setRate(nextRate)}>
          {String(audio.rate).replace(".", ",")}×
        </button>
        <button type="button" className={styles.skip} aria-label={`Назад на ${SKIP_SECONDS} секунд`} onClick={() => audio.seekBy(-SKIP_SECONDS)}>
          −{SKIP_SECONDS}
        </button>
        <button
          type="button"
          className={styles.play}
          aria-label={audio.playing ? "Пауза" : "Играть"}
          onClick={() => (audio.playing ? audio.pause() : audio.play(track))}
        >
          <Icon name={audio.playing ? "pause" : "play"} />
        </button>
        <button type="button" className={styles.skip} aria-label={`Вперёд на ${SKIP_SECONDS} секунд`} onClick={() => audio.seekBy(SKIP_SECONDS)}>
          +{SKIP_SECONDS}
        </button>
        <VolumeControl />
      </div>
      {/* Эквалайзер во всю ширину внизу: играет — полоски прыгают, пауза — застыли и приглушены. */}
      <span className={clsx(styles.wave, !audio.playing && styles.paused)} aria-hidden="true">
        {WAVE.map((delay, i) => (
          <i key={i} style={{ animationDelay: `${delay}s`, "--h": 0.3 + ((i * 5) % 7) / 10 } as CSSProperties} />
        ))}
      </span>
    </section>
  );
}

/**
 * Громкость: плашка со значком динамика, щелчок — окошко над ней с вертикальным ползунком и «без звука». Колесо мыши
 * над окошком тоже меняет громкость. Закрывается щелчком мимо и Esc.
 */
function VolumeControl() {
  const audio = useAudio();
  const [open, setOpen] = useState(false);
  const [beforeMute, setBeforeMute] = useState(1);
  const ref = useRef<HTMLDivElement>(null);
  const percent = Math.round(audio.volume * 100);
  const icon = audio.volume === 0 ? "volumeOff" : audio.volume < 0.5 ? "volumeLow" : "volume";

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggleMute() {
    if (audio.volume > 0) {
      setBeforeMute(audio.volume);
      audio.setVolume(0);
    } else {
      audio.setVolume(beforeMute || 1);
    }
  }

  return (
    <div ref={ref} className={styles.volume}>
      <button
        type="button"
        className={styles.rate}
        aria-label={`Громкость ${percent}%`}
        aria-expanded={open}
        title="Громкость"
        onClick={() => setOpen(!open)}
      >
        <Icon name={icon} />
      </button>
      {open && (
        <div
          className={styles.volumePopup}
          onWheel={(e) => audio.setVolume(Math.round((audio.volume - Math.sign(e.deltaY) * 0.05) * 100) / 100)}
        >
          <span className={styles.volumeValue}>{percent}%</span>
          <input
            type="range"
            className={styles.volumeRange}
            min={0}
            max={100}
            step={1}
            value={percent}
            style={{ "--share": `${percent}%` } as CSSProperties}
            aria-label="Громкость"
            onChange={(e) => audio.setVolume(Number(e.target.value) / 100)}
          />
          <button type="button" className={styles.mute} aria-label={audio.volume ? "Без звука" : "Вернуть звук"} title={audio.volume ? "Без звука" : "Вернуть звук"} onClick={toggleMute}>
            <Icon name={audio.volume ? "volumeOff" : icon === "volumeOff" ? "volume" : icon} />
          </button>
        </div>
      )}
    </div>
  );
}

/** Задержки анимации полосок — вразнобой, чтобы волна не шла строем. */
const WAVE = Array.from({ length: 28 }, (_, i) => -((i * 7) % 11) / 10);
