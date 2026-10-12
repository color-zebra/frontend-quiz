import clsx from "clsx";
import type { CSSProperties } from "react";
import type { Achievement } from "./achievements";
import styles from "./AchievementBadge.module.css";

interface AchievementBadgeProps {
  achievement: Achievement;
  earned: boolean;
  /** Диаметр медальона, px. */
  size?: number;
}

/** Медальон ачивки: полученная — цветная со свечением, не полученная — серая и полупрозрачная. */
export function AchievementBadge({ achievement, earned, size = 52 }: AchievementBadgeProps) {
  return (
    <span className={clsx(styles.badge, !earned && styles.locked)} style={{ "--size": `${size}px` } as CSSProperties}>
      <img src={`${import.meta.env.BASE_URL}achievements/${achievement.icon}`} alt="" />
    </span>
  );
}
