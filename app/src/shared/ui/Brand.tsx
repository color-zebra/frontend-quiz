import styles from "./Brand.module.css";

export function Brand() {
  return (
    <div className={styles.brand}>
      <span className={styles.logo} aria-hidden="true">
        {"{ }"}
      </span>
      Frontend Quiz
    </div>
  );
}
