import styles from "./Background.module.css";

/** Размытые цветные пятна под стеклом. Цвета берутся из темы. */
export function Background() {
  return (
    <div className={styles.bg} aria-hidden="true">
      <i className={`${styles.blob} ${styles.b1}`} />
      <i className={`${styles.blob} ${styles.b2}`} />
      <i className={`${styles.blob} ${styles.b3}`} />
    </div>
  );
}
