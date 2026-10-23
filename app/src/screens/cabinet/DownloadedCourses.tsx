import { useMemo, useState } from "react";
import { formatBytes, useAudioDownloads } from "../../features/audio/AudioDownloadsProvider";
import { useSets } from "../../features/sets/SetsProvider";
import type { SetRecord } from "../../features/sets/setsStore";
import { LESSON_FORMS, plural } from "../../shared/lib/plural";
import { Button, IconButton } from "../../shared/ui/Button";
import { Card } from "../../shared/ui/Card";
import { Sheet } from "../../shared/ui/Sheet";
import styles from "./CabinetScreen.module.css";

const COURSE_FORMS = ["курс", "курса", "курсов"] as const;

/** Сколько места занимает курс на устройстве: текст файла (оценка по JSON) — картинки и аудио отдельно. */
function getTextBytes(record: SetRecord) {
  return new Blob([JSON.stringify(record.file)]).size;
}

/**
 * «Скачанные курсы» в кабинете: что лежит на устройстве и сколько занимает, с удалением. Курс скачивается, когда
 * его начинают, — здесь видно, что место кончается, и можно убрать пройденное.
 */
export function DownloadedCourses() {
  const { sets, removeSet } = useSets();
  const { getCourseAudio } = useAudioDownloads();
  const [toDelete, setToDelete] = useState<SetRecord | null>(null);
  const courses = sets.filter((record) => (record.file.lessons?.length ?? 0) > 0);
  const sizes = useMemo(() => new Map(courses.map((r) => [r.id, getTextBytes(r)])), [courses.map((r) => r.updatedAt).join()]);

  if (courses.length === 0) return null;
  const total = courses.reduce((sum, r) => sum + (sizes.get(r.id) ?? 0) + getCourseAudio(r.id).storedBytes, 0);

  return (
    <Card label={`Скачанные курсы · ${courses.length} ${plural(courses.length, COURSE_FORMS)} · ${formatBytes(total)}`}>
      <ul className={styles.courseList}>
        {courses.map((record) => {
          const audioBytes = getCourseAudio(record.id).storedBytes;
          const lessons = record.file.lessons?.length ?? 0;
          return (
            <li key={record.id} className={styles.courseRow}>
              <span className={styles.courseText}>
                <span className={styles.courseTitle}>{record.title}</span>
                <span className={styles.courseMeta}>
                  {lessons} {plural(lessons, LESSON_FORMS)} · {formatBytes(sizes.get(record.id) ?? 0)}
                  {audioBytes > 0 && ` · аудио ${formatBytes(audioBytes)}`}
                </span>
              </span>
              <IconButton icon="trash" label={`Удалить «${record.title}»`} onClick={() => setToDelete(record)} />
            </li>
          );
        })}
      </ul>

      <Sheet open={!!toDelete} title="Удалить курс?" onClose={() => setToDelete(null)}>
        {toDelete && (
          <div className={styles.confirm}>
            <p>
              Курс «{toDelete.title}» и его аудио пропадут с этого устройства. Отметки «освоен», заметки и ответы
              останутся: если начать курс снова, они вернутся.
            </p>
            <div className={styles.confirmButtons}>
              <Button variant="secondary" onClick={() => setToDelete(null)}>
                Оставить
              </Button>
              <Button
                variant="danger"
                icon="trash"
                onClick={() => {
                  removeSet(toDelete.id);
                  setToDelete(null);
                }}
              >
                Удалить
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </Card>
  );
}
