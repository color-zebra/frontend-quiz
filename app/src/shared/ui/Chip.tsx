import clsx from "clsx";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import styles from "./Chip.module.css";

interface ChipProps {
  label: string;
  /** Значок перед словом — например, у фильтров курсов: здесь расшифровываются значки из списка. */
  icon?: IconName;
  count?: number;
  on: boolean;
  onClick: () => void;
}

export function Chip({ label, icon, count, on, onClick }: ChipProps) {
  return (
    <button
      type="button"
      className={clsx(styles.chip, on && styles.on, count === 0 && styles.empty)}
      aria-pressed={on}
      onClick={onClick}
    >
      {icon && <Icon name={icon} className={styles.icon} />}
      {label}
      {count !== undefined && <span className={styles.count}>{count}</span>}
    </button>
  );
}

export function ChipGroup({ children }: { children: ReactNode }) {
  return <div className={styles.group}>{children}</div>;
}
