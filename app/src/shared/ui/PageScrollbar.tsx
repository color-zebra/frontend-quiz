import { useEffect, useRef, useState, type PointerEvent } from "react";
import styles from "./PageScrollbar.module.css";

/**
 * Полоса прокрутки страницы на десктопе — поверх фона. Системная полоса окна занимает свою полосу экрана: когда
 * страница становится длиннее окна, она появляется и сдвигает всё на свою ширину, а оставить ей место заранее
 * нельзя красиво — под ней браузер рисует только сплошной цвет, без пятен фона. Поэтому системная скрыта
 * (global.css), а эта рисуется поверх: ширины не занимает, фон под ней непрерывный. Тянуть ползунок и щёлкать
 * по дорожке можно мышью; колесо и клавиши прокручивают страницу как обычно.
 */
export function PageScrollbar() {
  const [state, setState] = useState({ size: 1, offset: 0 });
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startY: number; startScroll: number } | null>(null);

  useEffect(() => {
    const root = document.scrollingElement ?? document.documentElement;
    function update() {
      const max = root.scrollHeight - root.clientHeight;
      const size = root.scrollHeight ? root.clientHeight / root.scrollHeight : 1;
      setState({ size, offset: max > 0 ? (root.scrollTop / max) * (1 - size) : 0 });
    }
    update();
    const observer = new ResizeObserver(update);
    observer.observe(document.body);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  if (state.size >= 0.999) return null;

  // Сдвиг мыши по дорожке → прокрутка страницы в той же доле.
  function scrollFromPointer(deltaY: number, startScroll: number) {
    const root = document.scrollingElement ?? document.documentElement;
    const track = trackRef.current?.getBoundingClientRect().height ?? 1;
    const max = root.scrollHeight - root.clientHeight;
    root.scrollTop = startScroll + (deltaY / (track * (1 - state.size))) * max;
  }

  function onThumbDown(e: PointerEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startY: e.clientY, startScroll: (document.scrollingElement ?? document.documentElement).scrollTop };
  }

  function onThumbMove(e: PointerEvent<HTMLDivElement>) {
    if (drag.current) scrollFromPointer(e.clientY - drag.current.startY, drag.current.startScroll);
  }

  // Щелчок по дорожке — страница прокручивается так, чтобы ползунок встал серединой под курсор.
  function onTrackDown(e: PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const root = document.scrollingElement ?? document.documentElement;
    const share = Math.min(1, Math.max(0, ((e.clientY - rect.top) / rect.height - state.size / 2) / (1 - state.size)));
    root.scrollTo({ top: share * (root.scrollHeight - root.clientHeight), behavior: "smooth" });
  }

  return (
    <div ref={trackRef} className={styles.track} aria-hidden="true" onPointerDown={onTrackDown}>
      <div
        className={styles.thumb}
        style={{ top: `${state.offset * 100}%`, height: `${state.size * 100}%` }}
        onPointerDown={onThumbDown}
        onPointerMove={onThumbMove}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
      />
    </div>
  );
}
