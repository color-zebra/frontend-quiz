import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";
import glass from "./glass.module.css";
import { Icon, type IconName } from "./Icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Подсветка с точкой-меткой, например «у вопроса есть заметка». */
  marked?: boolean;
  /** danger — необратимое действие в подтверждении: цвет ошибки вместо главного градиента. */
  variant?: "primary" | "secondary" | "danger";
  icon?: IconName;
  iconAfter?: IconName;
}

export function Button({ variant = "primary", icon, iconAfter, marked = false, className, children, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className={clsx(styles.button, styles[variant], variant === "secondary" && glass.glass, marked && styles.marked, className)}
      {...rest}
    >
      {icon && <Icon name={icon} />}
      {children}
      {iconAfter && <Icon name={iconAfter} />}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  label: string;
  /** Идёт действие: иконка крутится, кнопка недоступна. */
  busy?: boolean;
  /** Подсветка с точкой-меткой. */
  marked?: boolean;
  /** Красная иконка — например, «Не согласен с вопросом». */
  danger?: boolean;
  /** Без своего стеклянного круга: кнопка стоит внутри общей капсулы. */
  bare?: boolean;
}

export function IconButton({
  icon,
  label,
  busy = false,
  marked = false,
  danger = false,
  bare = false,
  className,
  disabled,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      className={clsx(
        styles.iconButton,
        bare ? styles.bare : glass.glass,
        busy && styles.busy,
        marked && styles.marked,
        danger && styles.danger,
        className,
      )}
      aria-label={label}
      title={label}
      disabled={busy || disabled}
      aria-busy={busy || undefined}
      {...rest}
    >
      <Icon name={icon} />
    </button>
  );
}
