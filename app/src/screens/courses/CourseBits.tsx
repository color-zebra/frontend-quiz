import clsx from "clsx";
import type { CourseFeature } from "../../data/types";
import { FEATURE_INFO, type CourseProgressSummary } from "../../features/courses/courses";
import { countQuestions, LESSON_FORMS, plural } from "../../shared/lib/plural";
import { Icon } from "../../shared/ui/Icon";
import styles from "./Courses.module.css";

/** Значки курса в списках — без подписи: расшифровка в фильтрах «Всех курсов» и на странице курса. */
export function FeatureIcons({ features }: { features: readonly CourseFeature[] }) {
  if (features.length === 0) return null;
  return (
    <span className={styles.featureIcons}>
      {features.map((f) => (
        <span key={f} className={clsx(styles.featureIcon, styles[f])} role="img" aria-label={FEATURE_INFO[f].label} title={FEATURE_INFO[f].label}>
          <Icon name={FEATURE_INFO[f].icon} />
        </span>
      ))}
    </span>
  );
}

/** Значок со словом — на странице курса. */
export function FeatureBadge({ feature }: { feature: CourseFeature }) {
  return (
    <span className={clsx(styles.badge, styles[feature])}>
      <Icon name={FEATURE_INFO[feature].icon} />
      {FEATURE_INFO[feature].label}
    </span>
  );
}

/** «19 уроков · 93 вопроса». */
export function formatCourseSize(lessons: number, questions: number | undefined) {
  return [`${lessons} ${plural(lessons, LESSON_FORMS)}`, questions !== undefined && countQuestions(questions)].filter(Boolean).join(" · ");
}

/** Полоса прогресса с подписью справа: «5 из 19» или «урок 3 из 13». */
export function ProgressLine({ value, total, label, tone = "primary" }: { value: number; total: number; label?: string; tone?: "primary" | "ok" }) {
  const share = total ? Math.min(value / total, 1) : 0;
  return (
    <div className={styles.progress}>
      <span className={styles.bar} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={total} aria-label={label ?? `${value} из ${total}`}>
        <span className={clsx(styles.fill, tone === "ok" && styles.fillOk)} style={{ width: `${share * 100}%` }} />
      </span>
      {label && <span className={styles.progressLabel}>{label}</span>}
    </div>
  );
}

/**
 * Пометки курса в списке: значки, прогресс и «скачан» — каждая сама по себе. Прогресс живёт отдельно от файлов
 * и переживает удаление курса; «скачан» говорит только о том, лежит ли курс на телефоне.
 */
export function CourseMarks({
  features,
  progress,
  downloaded,
}: {
  features: readonly CourseFeature[];
  progress: CourseProgressSummary | null;
  downloaded: boolean;
}) {
  const started = progress?.started;
  if (features.length === 0 && !started && !downloaded) return null;
  return (
    <span className={styles.cardFoot}>
      <FeatureIcons features={features} />
      {started && (progress.finished ? <DoneMark /> : <span className={styles.pill}>урок {progress.number} из {progress.total}</span>)}
      {downloaded && (
        <span className={styles.downloaded}>
          <Icon name="check" />
          скачан
        </span>
      )}
    </span>
  );
}

/** «Пройден» — зелёной пилюлей. */
export function DoneMark() {
  return (
    <span className={styles.done}>
      <Icon name="check" />
      Пройден
    </span>
  );
}
