import { useSyncExternalStore } from "react";

/**
 * Ширина, с которой включается десктопная раскладка: боковое меню, широкие экраны. Уже — телефонная вёрстка
 * (она же для планшетов). То же число — в @media (min-width: 900px) у стилей.
 */
export const DESKTOP_QUERY = "(min-width: 900px)";

/** Узкий десктоп (900–1099 px, например окно на половину экрана 1920): здесь боковое меню можно свернуть. */
export const NARROW_DESKTOP_QUERY = "(max-width: 1099px)";

/** Совпадает ли окно с медиазапросом; меняется на лету, когда окно растягивают или сужают. */
export function useMediaQuery(media: string) {
  return useSyncExternalStore(
    (listener) => {
      const query = window.matchMedia(media);
      query.addEventListener("change", listener);
      return () => query.removeEventListener("change", listener);
    },
    () => window.matchMedia(media).matches,
  );
}

/** Окно достаточно широкое для десктопной раскладки. Меняется на лету, когда окно растягивают или сужают. */
export function useIsDesktop() {
  return useMediaQuery(DESKTOP_QUERY);
}
