import clsx from "clsx";
import { useEffect, useState } from "react";
import type { Question } from "../../data/types";
import glass from "../../shared/ui/glass.module.css";
import { Icon } from "../../shared/ui/Icon";
import { Sheet } from "../../shared/ui/Sheet";
import { ExplanationBody } from "./QuestionView";
import styles from "./WhyButton.module.css";

/** Кнопка «Почему?» над нижней панелью: открывает разбор «Как это устроено», который внизу легко не заметить. */
export function WhyButton({ question }: { question: Question }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className={clsx(styles.why, glass.glass)} onClick={() => setOpen(true)}>
        <Icon name="bulb" />
        Почему?
      </button>
      <Sheet open={open} title="Как это устроено" onClose={() => setOpen(false)}>
        <ExplanationBody question={question} />
      </Sheet>
    </>
  );
}

// Нижняя часть экрана, которую закрывают панель и сама кнопка: пояснение за ними ещё не видно.
const HIDDEN_BOTTOM = "-140px";

/**
 * Видна ли на экране хоть часть элемента. Возвращает ref для элемента и ответ; пока элемента нет — false.
 * Нужен кнопке «Почему?»: когда пояснение и так на экране, кнопка не нужна.
 */
export function useIsOnScreen() {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [onScreen, setOnScreen] = useState(false);

  useEffect(() => {
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), {
      rootMargin: `0px 0px ${HIDDEN_BOTTOM} 0px`,
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return [setElement, !!element && onScreen] as const;
}
