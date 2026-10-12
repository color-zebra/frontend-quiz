import type { ReactNode } from "react";
import styles from "./ScreenTitle.module.css";

export function ScreenTitle({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>{title}</h1>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  );
}
