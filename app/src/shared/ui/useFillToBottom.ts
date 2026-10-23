import { useLayoutEffect, useRef } from "react";

/**
 * Колонка тянется от своего верха до низа окна (с полем gap): до прокрутки — от места, где стоит, после — от верха,
 * куда прилипла. Карточки внутри раздвигаются по высоте поровну. Только CSS этого не умеет: высота зависит от того,
 * сколько уже прокрутили.
 */
export function useFillToBottom<T extends HTMLElement>(gap = 24) {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    // Масштаб страницы на большом мониторе (zoom у html): и координаты элемента, и высота окна приходят без него —
    // делим, чтобы получить CSS-пиксели страницы.
    const zoom = () => parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
    function update() {
      if (!element) return;
      const z = zoom();
      const top = Math.max(gap, element.getBoundingClientRect().top / z);
      element.style.minHeight = `${Math.max(0, window.innerHeight / z - top - gap)}px`;
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [gap]);
  return ref;
}
