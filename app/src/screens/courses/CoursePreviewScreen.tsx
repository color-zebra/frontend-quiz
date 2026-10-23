import clsx from "clsx";
import type { CourseFeature } from "../../data/types";
import { formatBytes } from "../../features/audio/AudioDownloadsProvider";
import { getCompanion, getSeriesPlace, type CourseProgressSummary } from "../../features/courses/courses";
import type { CatalogEntry } from "../../features/sets/catalog";
import { LESSON_FORMS, plural } from "../../shared/lib/plural";
import { Button, IconButton } from "../../shared/ui/Button";
import { SectionLabel } from "../../shared/ui/Card";
import glass from "../../shared/ui/glass.module.css";
import { Icon } from "../../shared/ui/Icon";
import { Notice } from "../../shared/ui/Notice";
import { Screen, TopBar } from "../../shared/ui/Screen";
import { ScreenTitle } from "../../shared/ui/ScreenTitle";
import { formatTasks } from "./AllCoursesScreen";
import { FeatureBadge, formatCourseSize } from "./CourseBits";
import styles from "./Courses.module.css";

interface CoursePreviewScreenProps {
  entry: CatalogEntry;
  /** Прогресс, оставшийся с прошлого раза: курс удаляли с телефона, а отметки и место сохранились. */
  progress: CourseProgressSummary | null;
  onBack: () => void;
  /** «Начать курс»: скачать и открыть первый урок. */
  onStart: () => void;
  busy: boolean;
  message: { kind: "ok" | "error"; text: string } | null;
  onCloseMessage: () => void;
}

/** Что значит значок для человека: где его увидит и что из этого следует. */
function explainFeature(feature: CourseFeature, entry: CatalogEntry) {
  const total = entry.lessons.length;
  if (feature === "audio") {
    const voiced = entry.lessons.filter((l) => l.audio).length;
    const which = voiced === total ? "Все уроки" : `${voiced} ${plural(voiced, LESSON_FORMS)} из ${total}`;
    return `${which} можно слушать — с выключенным экраном, в дороге. Аудио качается отдельно, когда решишь.`;
  }
  const practice = entry.lessons.filter((l) => l.computer).length;
  const where = practice ? `В ${practice} ${plural(practice, ["уроке", "уроках", "уроках"])} из ${total}` : "В уроках";
  return `${where} есть задания за компьютером: демо-страницы, DevTools. Читать уроки и отвечать на вопросы можно с телефона.`;
}

/**
 * Курс до скачивания: всё, что нужно решить, браться ли, — описание, значки с объяснением, оглавление. Скачивается
 * он только по «Начать курс», и сразу открывается первый урок.
 */
export function CoursePreviewScreen({ entry, progress, onBack, onStart, busy, message, onCloseMessage }: CoursePreviewScreenProps) {
  const resume = progress?.started && !progress.finished;
  const series = getSeriesPlace(entry);
  const companion = getCompanion(entry.url);
  return (
    <Screen>
      <TopBar>
        <IconButton icon="arrowLeft" label="Назад" onClick={onBack} />
      </TopBar>
      {series && (
        <p className={styles.eyebrow}>
          {series.name} · курс {series.number} из {series.total}
        </p>
      )}
      <ScreenTitle title={entry.title} subtitle={formatCourseSize(entry.lessons.length, entry.count)} />
      <p className={styles.description}>{entry.description.replace(/^Курс \d+ из \d+,?\s*|^С уроками[^.]*\.\s*/i, "").replace(/^с уроками\.\s*/i, "")}</p>

      {entry.features.map((feature) => (
        <div key={feature} className={clsx(styles.featureNote, glass.glass)}>
          <FeatureBadge feature={feature} />
          <p>{explainFeature(feature, entry)}</p>
        </div>
      ))}

      {progress?.started && (
        <p className={styles.note}>
          {progress.finished
            ? "Ты уже прошёл этот курс — отметки сохранились."
            : `Ты остановился на уроке ${progress.number} из ${progress.total} — курс продолжится с него.`}
        </p>
      )}
      <Button iconAfter="arrowRight" disabled={busy} onClick={onStart}>
        {busy ? "Скачиваем курс…" : resume ? "Скачать и продолжить" : "Начать курс"}
      </Button>
      <p className={styles.note}>
        Курс скачается на устройство{entry.bytes ? ` (около ${formatBytes(entry.bytes)} текста)` : ""} и дальше работает без интернета
      </p>
      {message && <Notice kind={message.kind} text={message.text} onClose={onCloseMessage} />}

      {companion && (
        <div className={clsx(styles.featureNote, glass.glass)}>
          <span className={styles.badge}>
            <Icon name="mic" />
            Устная тренировка к курсу
          </span>
          <p>
            {formatTasks(companion.count ?? 0)} для ответа вслух с эталонным планом — отдельно, когда пройдёшь уроки.
            Найти её можно на странице курса и в «Тренажёре».
          </p>
        </div>
      )}

      <SectionLabel>Оглавление</SectionLabel>
      <ol className={clsx(styles.toc, glass.glass)}>
        {entry.lessons.map((lesson, index) => (
          <li key={`${index}-${lesson.title}`} className={styles.tocItem}>
            <span className={styles.tocNumber}>{index + 1}</span>
            <span className={styles.tocTitle}>{lesson.title}</span>
            {lesson.computer && (
              <Icon name="monitor" className={clsx(styles.tocMark, styles.computer)} aria-label="Практика за компьютером" />
            )}
          </li>
        ))}
      </ol>
    </Screen>
  );
}
