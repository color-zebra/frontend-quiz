import { useSyncExternalStore } from "react";

/**
 * Место над нижней панелью кнопок (ActionBar), справа, над «Почему?». Панель сама его отдаёт, а плавающие
 * кнопки приложения — свёрнутый плеер — встают туда порталом: тогда они едут вместе с панелью и не наезжают
 * на «Почему?». Нет панели на экране — места нет, и кнопка стоит в своём обычном углу.
 */
let slot: HTMLElement | null = null;
const listeners = new Set<() => void>();

/** Ref-колбэк для элемента-места: панель появилась — место есть, ушла с экрана — нет. */
export function setDockSlot(element: HTMLElement | null) {
  if (slot === element) return;
  slot = element;
  listeners.forEach((listener) => listener());
}

export function useDockSlot() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => slot,
  );
}
