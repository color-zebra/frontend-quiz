import clsx from "clsx";
import type { CSSProperties } from "react";
import styles from "./Segmented.module.css";

interface SegmentedProps<T extends string | number> {
  /** count — число второй строкой под названием, например «Ошибки» / «23». */
  options: readonly { value: T; label: string; count?: number; disabled?: boolean }[];
  isOn: (value: T) => boolean;
  onSelect: (value: T) => void;
  label: string;
}

/** Ряд кнопок-сегментов. Одиночный это выбор или множественный, решает родитель через isOn/onSelect. */
export function Segmented<T extends string | number>({ options, isOn, onSelect, label }: SegmentedProps<T>) {
  return (
    <div className={styles.segmented} style={{ "--n": options.length } as CSSProperties} role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={clsx(styles.seg, isOn(o.value) && styles.on)}
          aria-pressed={isOn(o.value)}
          disabled={o.disabled}
          aria-label={o.count === undefined ? undefined : `${o.label} · ${o.count}`}
          onClick={() => onSelect(o.value)}
        >
          {o.count === undefined ? (
            o.label
          ) : (
            // Название и число — всегда двумя строками: все сегменты одной высоты, и 4-значное число влезает.
            <span className={styles.twoLines}>
              <span>{o.label}</span>
              <span className={styles.count}>{o.count}</span>
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
