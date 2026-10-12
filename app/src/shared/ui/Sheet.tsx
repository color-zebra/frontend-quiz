import { useEffect, useRef, type ReactNode } from "react";
import { IconButton } from "./Button";
import styles from "./Sheet.module.css";

interface SheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * Панель поверх экрана: на телефоне выезжает снизу, на широком экране — по центру.
 * Сделана на <dialog>: фокус внутри и закрытие по Esc браузер обеспечивает сам.
 */
export function Sheet({ open, title, onClose, footer, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.sheet}
      aria-label={title}
      onClose={onClose}
      // Клик по затемнению вокруг панели приходит в сам <dialog>.
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {open && (
        <div className={styles.panel}>
          <header className={styles.header}>
            <h2 className={styles.title}>{title}</h2>
            <IconButton icon="close" label="Закрыть" onClick={onClose} />
          </header>
          <div className={styles.body}>{children}</div>
          {footer && <div className={styles.footer}>{footer}</div>}
        </div>
      )}
    </dialog>
  );
}
