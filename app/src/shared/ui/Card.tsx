import clsx from "clsx";
import type { ReactNode } from "react";
import styles from "./Card.module.css";
import glass from "./glass.module.css";

interface CardProps {
  label?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Card({ label, className, children }: CardProps) {
  return (
    <section className={clsx(styles.card, glass.glass, className)}>
      {label && <SectionLabel>{label}</SectionLabel>}
      {children}
    </section>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className={styles.label}>{children}</div>;
}
