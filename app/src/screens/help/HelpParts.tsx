import clsx from "clsx";
import { useState, type ReactNode } from "react";
import { Button } from "../../shared/ui/Button";
import glass from "../../shared/ui/glass.module.css";
import { Icon } from "../../shared/ui/Icon";
import styles from "./Help.module.css";

interface HelpSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

/** Сворачиваемый раздел инструкции. Свёрнутые заголовки работают как оглавление. */
export function HelpSection({ title, defaultOpen = false, children }: HelpSectionProps) {
  return (
    <details className={clsx(styles.section, glass.glass)} open={defaultOpen}>
      <summary className={styles.summary}>
        <span>{title}</span>
        <Icon name="chevronRight" className={styles.marker} />
      </summary>
      <div className={styles.body}>{children}</div>
    </details>
  );
}

/** Ссылка на раздел инструкции, которую можно отправить другу. */
export function ShareLinkButton({ hash, title }: { hash: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${location.origin}${location.pathname}${hash}`;

  async function share() {
    // На телефоне — системное меню «Поделиться», на ноутбуке — копирование в буфер. Проверяем сенсорный экран:
    // Chrome на Windows тоже умеет navigator.share, но там от кнопки ждут именно копирования.
    if (navigator.share && matchMedia("(pointer: coarse)").matches) {
      await navigator.share({ title, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard?.writeText(url).then(
      () => setCopied(true),
      () => undefined,
    );
  }

  return (
    <Button variant="secondary" icon={copied ? "check" : "external"} onClick={share}>
      {copied ? "Ссылка скопирована" : "Поделиться ссылкой на инструкцию"}
    </Button>
  );
}
