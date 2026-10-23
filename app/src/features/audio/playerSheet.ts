import { useSyncExternalStore } from "react";

/**
 * Большой плеер (шторка) открывается не только свёрнутым значком, но и кнопкой «развернуть» десктопного плеера
 * в боковом меню. Состояние «шторка открыта» поэтому общее.
 */
let open = false;
const listeners = new Set<() => void>();

function set(value: boolean) {
  if (open === value) return;
  open = value;
  listeners.forEach((listener) => listener());
}

export const openPlayerSheet = () => set(true);
export const closePlayerSheet = () => set(false);

export function usePlayerSheetOpen() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => open,
  );
}
