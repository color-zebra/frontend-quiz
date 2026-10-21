import { useEffect, useState } from "react";
import { formatBytes, useAudioDownloads } from "../../features/audio/AudioDownloadsProvider";
import { LESSON_FORMS, plural } from "../../shared/lib/plural";
import { Button } from "../../shared/ui/Button";
import { Card } from "../../shared/ui/Card";
import { Sheet } from "../../shared/ui/Sheet";
import styles from "./Lessons.module.css";

/**
 * «Аудио курса» в оглавлении: скачать озвучку на телефон для прослушивания без сети, прогресс загрузки,
 * «Аудио на телефоне · Удалить аудио». Блока нет, если у курса нет озвучки.
 */
export function CourseAudio({ setId }: { setId: string }) {
  const downloads = useAudioDownloads();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const audio = downloads.getCourseAudio(setId);
  const { job } = audio;
  const files = audio.urls.length;

  // Размер узнаём заранее — чтобы на кнопке было «Скачать аудио · 85 МБ», а не кот в мешке.
  useEffect(() => {
    if (files) downloads.probeCourse(setId);
  }, [setId, files]);

  if (!files) return null;
  if (!downloads.available) {
    return (
      <Card label="Аудио курса">
        <p className={styles.audioText}>Этот браузер не умеет хранить аудио на телефоне — слушать можно только с интернетом.</p>
      </Card>
    );
  }

  const all = audio.storedCount === files;
  const missing = audio.missingBytes !== null ? ` · ${formatBytes(audio.missingBytes)}` : "";

  function renderState() {
    if (job?.running) {
      const percent = job.total ? Math.min(100, Math.round((job.loaded / job.total) * 100)) : null;
      return (
        <>
          <p className={styles.audioText}>
            Скачиваем: {job.total ? `${formatBytes(job.loaded)} из ${formatBytes(job.total)}` : formatBytes(job.loaded)} · файл{" "}
            {Math.min(job.filesDone + 1, job.files)} из {job.files}. Можно уйти с экрана — загрузка продолжится, пока
            приложение открыто.
          </p>
          <progress className={styles.audioProgress} max={100} value={percent ?? undefined} aria-label="Загрузка аудио" />
        </>
      );
    }
    if (all) {
      return (
        <p className={styles.audioText}>
          <span className={styles.masteredText}>Аудио на телефоне</span> · {formatBytes(audio.storedBytes)}. Курс
          можно слушать без интернета.
        </p>
      );
    }
    return (
      <p className={styles.audioText}>
        {audio.storedCount
          ? `Скачано ${audio.storedCount} из ${files} ${plural(files, LESSON_FORMS)} · ${formatBytes(audio.storedBytes)}.`
          : `Озвучено ${files} ${plural(files, LESSON_FORMS)}.`}{" "}
        Скачай, чтобы слушать без интернета.
      </p>
    );
  }

  return (
    <Card label="Аудио курса">
      {renderState()}
      {job?.error && !job.running && (
        <p className={styles.audioError} role="alert">
          {job.error}
        </p>
      )}
      {!job?.running && (
        <div className={styles.audioButtons}>
          {!all && (
            <Button variant="secondary" icon="download" onClick={() => downloads.download(setId)}>
              {audio.storedCount ? `Докачать${missing}` : `Скачать аудио${missing}`}
            </Button>
          )}
          {audio.storedCount > 0 && (
            <Button variant="secondary" icon="trash" className={styles.audioDelete} onClick={() => setConfirmOpen(true)}>
              Удалить аудио
            </Button>
          )}
        </div>
      )}

      <Sheet open={confirmOpen} title="Удалить аудио курса?" onClose={() => setConfirmOpen(false)}>
        <div className={styles.confirm}>
          <p>
            С телефона сотрётся озвучка этого курса — {formatBytes(audio.storedBytes)}. Сам курс, отметки «освоен» и
            место, где ты остановился, останутся. Слушать можно будет с интернетом или скачать заново.
          </p>
          <div className={styles.confirmButtons}>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Отмена
            </Button>
            <Button
              icon="trash"
              onClick={() => {
                downloads.removeCourseAudio(setId);
                setConfirmOpen(false);
              }}
            >
              Удалить
            </Button>
          </div>
        </div>
      </Sheet>
    </Card>
  );
}
