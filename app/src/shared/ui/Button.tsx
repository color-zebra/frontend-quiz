import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";
import glass from "./glass.module.css";
import { Icon, type IconName } from "./Icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  icon?: IconName;
  iconAfter?: IconName;
}

export function Button({ variant = "primary", icon, iconAfter, className, children, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className={clsx(styles.button, styles[variant], variant === "secondary" && glass.glass, className)}
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
}

export function IconButton({ icon, label, className, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      className={clsx(styles.iconButton, glass.glass, className)}
      aria-label={label}
      title={label}
      {...rest}
    >
      <Icon name={icon} />
    </button>
  );
}
