import clsx from "clsx";
import type { CSSProperties } from "react";
import { IconButton } from "../../shared/ui/Button";
import { Icon } from "../../shared/ui/Icon";
import { AUDIO_RATES, formatAudioTime, SKIP_SECONDS, useAudio } from "./AudioProvider";
import { openPlayerSheet } from "./playerSheet";
import styles from "./DesktopPlayer.module.css";

/**
 * Плеер озвучки на десктопе — карточкой внизу бокового меню (в уроке — под оглавлением курса). Всё главное
 * под рукой: название урока (щелчок — открыть урок), перемотка по полосе, ±15 секунд, пауза, скорость. Большой
 * плеер с остальным (следующий урок, вопросы, офлайн) открывается кнопкой «развернуть».
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
        <span className={clsx(styles.equalizer, !audio.playing && styles.paused)} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <button type="button" className={styles.title} title="Открыть урок" onClick={() => onOpenLesson(track.setId, track.lessonId)}>
          <b>{track.title}</b>
          <span>{audio.error ? "Не удалось загрузить звук" : track.course}</span>
        </button>
        <IconButton icon="close" label="Закрыть плеер" bare className={styles.small} onClick={audio.close} />
      </div>
      <div className={styles.time}>
        <span>{formatAudioTime(time)}</span>
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
        <span>{formatAudioTime(duration)}</span>
      </div>
      <div className={styles.controls}>
        <button type="button" className={styles.rate} title="Скорость" onClick={() => audio.setRate(nextRate)}>
          {String(audio.rate).replace(".", ",")}×
        </button>
        <IconButton icon="back15" label={`Назад на ${SKIP_SECONDS} секунд`} bare onClick={() => audio.seekBy(-SKIP_SECONDS)} />
        <button
          type="button"
          className={styles.play}
          aria-label={audio.playing ? "Пауза" : "Играть"}
          onClick={() => (audio.playing ? audio.pause() : audio.play(track))}
        >
          <Icon name={audio.playing ? "pause" : "play"} />
        </button>
        <IconButton icon="fwd15" label={`Вперёд на ${SKIP_SECONDS} секунд`} bare onClick={() => audio.seekBy(SKIP_SECONDS)} />
        <IconButton icon="chevronDown" label="Развернуть плеер" bare className={styles.expand} onClick={openPlayerSheet} />
      </div>
    </section>
  );
}
