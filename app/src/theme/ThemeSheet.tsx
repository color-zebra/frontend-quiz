import clsx from "clsx";
import { Sheet } from "../shared/ui/Sheet";
import styles from "./ThemeSheet.module.css";
import { THEMES, type ThemeId } from "./themes";

interface ThemeSheetProps {
  open: boolean;
  current: ThemeId;
  onSelect: (id: ThemeId) => void;
  onClose: () => void;
}

/** Выбор темы. Каждая карточка — живое превью: на ней стоит data-theme своей темы. */
export function ThemeSheet({ open, current, onSelect, onClose }: ThemeSheetProps) {
  return (
    <Sheet open={open} title="Оформление" onClose={onClose}>
      <div className={styles.grid}>
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            data-theme={theme.id}
            className={clsx(styles.card, theme.id === current && styles.current)}
            aria-pressed={theme.id === current}
            onClick={() => onSelect(theme.id)}
          >
            <span className={styles.preview} aria-hidden="true">
              <i className={clsx(styles.blob, styles.b1)} />
              <i className={clsx(styles.blob, styles.b2)} />
              <span className={styles.miniGlass}>
                <span className={styles.miniLine} />
                <span className={clsx(styles.miniLine, styles.short)} />
              </span>
              <span className={styles.miniButton} />
            </span>
            <span className={styles.name}>{theme.name}</span>
            <span className={styles.desc}>{theme.description}</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
