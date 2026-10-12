import clsx from "clsx";
import type { ReactNode } from "react";
import styles from "./Chip.module.css";

interface ChipProps {
  label: string;
  count?: number;
  on: boolean;
  onClick: () => void;
}

export function Chip({ label, count, on, onClick }: ChipProps) {
  return (
    <button
      type="button"
      className={clsx(styles.chip, on && styles.on, count === 0 && styles.empty)}
      aria-pressed={on}
      onClick={onClick}
    >
      {label}
      {count !== undefined && <span className={styles.count}>{count}</span>}
    </button>
  );
}

export function ChipGroup({ children }: { children: ReactNode }) {
  return <div className={styles.group}>{children}</div>;
}
