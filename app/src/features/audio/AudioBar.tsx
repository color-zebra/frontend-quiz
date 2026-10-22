import clsx from "clsx";
import { useEffect, useRef } from "react";
import { IconButton } from "../../shared/ui/Button";
import { Icon } from "../../shared/ui/Icon";
import { useAudioDownloads } from "./AudioDownloadsProvider";
import { formatAudioTime, SKIP_SECONDS, useAudio } from "./AudioProvider";
import styles from "./AudioBar.module.css";

interface AudioBarProps {
  /** Нажатие на название — открыть урок, который играет. */
  onOpenLesson: (setId: string, lessonId: string) => void;
}

/** «1,25×» — запятая, как пишут дроби по-русски. */
function formatRate(rate: number) {
  return `${String(rate).replace(".", ",")}×`;
}

/**
 * Мини-плеер внизу экрана — пока выбран урок для прослушивания, на любом экране. Свою высоту он сообщает вёрстке
 * переменной --audio-bar: нижняя панель кнопок и низ экрана поднимаются над ним, а не прячутся под ним.
 */
export function AudioBar({ onOpenLesson }: AudioBarProps) {
  const audio = useAudio();
  const { isStored } = useAudioDownloads();
  const barRef = useRef<HTMLDivElement>(null);
  const { track } = audio;

  useEffect(() => {
    const bar = barRef.current;
    const root = document.documentElement;
    if (!bar) return;
    // Высота плеера плюс его отступ от низа окна (--lift в CSS: больше в полноэкранном приложении).
    const lift = Number.parseFloat(getComputedStyle(bar).getPropertyValue("--lift")) || 8;
    const observer = new ResizeObserver(() => root.style.setProperty("--audio-bar", `${bar.offsetHeight + lift}px`));
    observer.observe(bar);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--audio-bar");
    };
  }, [track]);

  if (!track) return null;
  const duration = audio.duration || 0;
  const status = audio.error
    ? !navigator.onLine && !isStored(track.src)
      ? "Нет сети, а аудио этого урока не скачано"
      : "Не удалось загрузить аудио — проверь связь"
    : audio.ended
      ? "Урок дослушан"
      : `${formatAudioTime(audio.time)} / ${duration ? formatAudioTime(duration) : "…"}`;

  return (
    <div ref={barRef} className={styles.bar} role="region" aria-label="Плеер урока">
      <div className={styles.head}>
        <button type="button" className={styles.title} onClick={() => onOpenLesson(track.setId, track.lessonId)}>
          <span className={styles.name}>{track.title}</span>
          <span className={clsx(styles.status, audio.error && styles.error)}>{status}</span>
        </button>
        <IconButton icon="close" label="Закрыть плеер" bare className={styles.close} onClick={audio.close} />
      </div>
      <input
        className={styles.range}
        type="range"
        min={0}
        max={duration || 1}
        step={1}
        value={Math.min(audio.time, duration || 1)}
        disabled={!duration}
        aria-label="Перемотка"
        aria-valuetext={formatAudioTime(audio.time)}
        onChange={(e) => audio.seekTo(Number(e.target.value))}
      />
      <div className={styles.controls}>
        <button type="button" className={clsx(styles.rate, styles.rateButton)} aria-label="Скорость" onClick={audio.cycleRate}>
          {formatRate(audio.rate)}
        </button>
        <IconButton icon="back15" label={`−${SKIP_SECONDS} секунд`} bare className={styles.skip} onClick={() => audio.seekBy(-SKIP_SECONDS)} />
        <button
          type="button"
          className={styles.play}
          aria-label={audio.playing ? "Пауза" : "Слушать"}
          onClick={() => (audio.playing ? audio.pause() : audio.play(track))}
        >
          <Icon name={audio.playing ? "pause" : "play"} />
        </button>
        <IconButton icon="fwd15" label={`+${SKIP_SECONDS} секунд`} bare className={styles.skip} onClick={() => audio.seekBy(SKIP_SECONDS)} />
        {/* Пустое место справа — чтобы кнопка «играть» стояла ровно посередине. */}
        <span className={styles.rate} aria-hidden="true" />
      </div>
    </div>
  );
}
