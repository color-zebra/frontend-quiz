import { useSyncExternalStore } from "react";

/**
 * Ширина, с которой включается десктопная раскладка: боковое меню, широкие экраны. Уже — телефонная вёрстка
 * (она же для планшетов). То же число — в @media (min-width: 1024px) у стилей.
 */
export const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribe(listener: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

/** Окно достаточно широкое для десктопной раскладки. Меняется на лету, когда окно растягивают или сужают. */
export function useIsDesktop() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(DESKTOP_QUERY).matches);
}
