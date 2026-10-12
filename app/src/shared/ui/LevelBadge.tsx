import clsx from "clsx";
import type { Level } from "../../data/types";
import styles from "./LevelBadge.module.css";

export function LevelBadge({ level }: { level: Level }) {
  return <span className={clsx(styles.level, styles[level])}>{level}</span>;
}
