import type { ReactNode } from "react";
import styles from "./ProgressRing.module.css";

/** Кольцо прогресса с числом внутри: «5 / 19, уроков освоено». На десктопе — у «Продолжить» и в шапке курса. */
export function ProgressRing({ value, total, size = 132, children }: { value: number; total: number; size?: number; children?: ReactNode }) {
  const r = size / 2 - 8;
  const length = 2 * Math.PI * r;
  const share = total ? Math.min(value / total, 1) : 0;
  return (
    <span
      className={styles.ring}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${value} из ${total}${typeof children === "string" ? ` ${children}` : ""}`}
    >
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle className={styles.track} cx={size / 2} cy={size / 2} r={r} />
        <circle
          className={styles.value}
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeDasharray={`${length * share} ${length}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className={styles.text} aria-hidden="true">
        <b>
          {value}
          <small>/{total}</small>
        </b>
        {children}
      </span>
    </span>
  );
}
