import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { IconButton } from "./Button";
import styles from "./ImageViewer.module.css";

interface ImageViewerProps {
  open: boolean;
  src: string;
  alt: string;
  caption?: string;
  /** Тот же режим загрузки, что у картинки в уроке, — тогда браузер возьмёт её из кэша, а не скачает заново. */
  crossOrigin?: "anonymous";
  onClose: () => void;
}

/** Положение картинки: левый верхний угол на экране и масштаб относительно «вписана в экран». */
interface View {
  scale: number;
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

const MAX_SCALE = 5;
const DOUBLE_TAP_SCALE = 2.5;
const STEP = 1.5;
const PAN_STEP = 60;
const DOUBLE_TAP_MS = 300;
// Палец сдвинулся больше — это перетаскивание, а не касание.
const TAP_SLOP = 10;

interface HistoryMark {
  imageViewer?: boolean;
}

/** Картинка на экране не уезжает из виду: меньше экрана — по центру, больше — края не отходят от краёв экрана. */
function clamp(view: View, fit: Size, stage: Size): View {
  const scale = Math.min(MAX_SCALE, Math.max(1, view.scale));
  const width = fit.width * scale;
  const height = fit.height * scale;
  const x = width <= stage.width ? (stage.width - width) / 2 : Math.min(0, Math.max(stage.width - width, view.x));
  const y = height <= stage.height ? (stage.height - height) / 2 : Math.min(0, Math.max(stage.height - height, view.y));
  return { scale, x, y };
}

/** Масштаб меняется вокруг точки экрана: то, что было под пальцем или курсором, под ним и остаётся. */
function zoomAt(view: View, scale: number, px: number, py: number): View {
  const k = scale / view.scale;
  return { scale, x: px - (px - view.x) * k, y: py - (py - view.y) * k };
}

/**
 * Картинка на весь экран: увеличить двумя пальцами, колесом или кнопками, двигать пальцем или мышью, двойное касание —
 * «увеличить здесь» или «вписать обратно». Сделана на <dialog>: фокус внутри и Esc браузер обеспечивает сам.
 * Пока просмотр открыт, в истории браузера лежит своя запись: системная «Назад» на Android закрывает просмотр,
 * а не уводит из урока. Запись повторяет глубину экрана, поэтому стек экранов (useScreenStack) её не замечает.
 */
export function ImageViewer({ open, src, alt, caption, crossOrigin, onClose }: ImageViewerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [natural, setNatural] = useState<Size | null>(null);
  const [stage, setStage] = useState<Size>({ width: 0, height: 0 });
  const [view, setView] = useState<View>({ scale: 1, x: 0, y: 0 });
  const viewRef = useRef(view);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  // Начало жеста двумя пальцами: из него считается и масштаб, и сдвиг, чтобы ошибки не копились от кадра к кадру.
  const pinch = useRef<{ view: View; distance: number; mid: { x: number; y: number } } | null>(null);
  const tap = useRef<{ time: number; x: number; y: number } | null>(null);
  // Где палец опустился: ушёл от этой точки дальше TAP_SLOP — это перетаскивание, а не касание.
  const downAt = useRef({ x: 0, y: 0 });
  const moved = useRef(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  const fit: Size = (() => {
    if (!natural || !stage.width || !stage.height) return { width: 0, height: 0 };
    const k = Math.min(stage.width / natural.width, stage.height / natural.height);
    return { width: natural.width * k, height: natural.height * k };
  })();

  const apply = useCallback(
    (next: View) => {
      const clamped = clamp(next, fit, stage);
      viewRef.current = clamped;
      setView(clamped);
    },
    [fit.width, fit.height, stage.width, stage.height],
  );

  const reset = useCallback(() => apply({ scale: 1, x: 0, y: 0 }), [apply]);

  // Открыть и закрыть диалог вместе с записью в истории браузера.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    if (!dialog.open) dialog.showModal();
    history.pushState({ ...(history.state as object | null), imageViewer: true } satisfies HistoryMark, "");
    const onPopState = () => onCloseRef.current();
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      if (dialog.open) dialog.close();
    };
  }, [open]);

  // Размер экрана: при повороте телефона картинка снова вписывается целиком.
  useEffect(() => {
    if (!open) return;
    const el = stageRef.current;
    if (!el) return;
    const measure = () => setStage({ width: el.clientWidth, height: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [open]);

  // Каждое открытие — с картинки, вписанной в экран.
  useEffect(() => {
    if (!open) return;
    const initial = { scale: 1, x: 0, y: 0 };
    viewRef.current = initial;
    setView(initial);
  }, [open]);

  // Картинка загрузилась или экран повернули — удержать её в границах, не сбрасывая масштаб.
  useEffect(() => {
    if (open) apply(viewRef.current);
  }, [open, apply]);

  // Колесо мыши: обработчик не пассивный, иначе вместе с масштабом прокручивалась бы страница под просмотром.
  useEffect(() => {
    const el = stageRef.current;
    if (!open || !el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const current = viewRef.current;
      const scale = Math.min(MAX_SCALE, Math.max(1, current.scale * Math.exp(-e.deltaY * 0.002)));
      apply(zoomAt(current, scale, e.clientX - rect.left, e.clientY - rect.top));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [open, apply]);

  /** Закрыть кнопкой или Esc: убрать свою запись из истории, а закроет просмотр её popstate. */
  function requestClose() {
    if ((history.state as HistoryMark | null)?.imageViewer) history.back();
    else onClose();
  }

  function zoomBy(factor: number) {
    const current = viewRef.current;
    const scale = Math.min(MAX_SCALE, Math.max(1, current.scale * factor));
    apply(zoomAt(current, scale, stage.width / 2, stage.height / 2));
  }

  function local(e: PointerEvent) {
    const rect = stageRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function startPinch() {
    const [a, b] = [...pointers.current.values()];
    pinch.current = {
      view: viewRef.current,
      distance: Math.hypot(a.x - b.x, a.y - b.y) || 1,
      mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    };
    moved.current = true;
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const point = local(e);
    pointers.current.set(e.pointerId, point);
    if (pointers.current.size === 1) {
      downAt.current = point;
      moved.current = false;
    }
    if (pointers.current.size === 2) startPinch();
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const previous = pointers.current.get(e.pointerId);
    if (!previous) return;
    const point = local(e);
    pointers.current.set(e.pointerId, point);
    if (Math.hypot(point.x - downAt.current.x, point.y - downAt.current.y) > TAP_SLOP) moved.current = true;

    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const gesture = pinch.current;
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const scale = Math.min(MAX_SCALE, Math.max(1, (gesture.view.scale * distance) / gesture.distance));
      // Точка картинки, которая была под серединой между пальцами, остаётся под ней.
      const contentX = (gesture.mid.x - gesture.view.x) / gesture.view.scale;
      const contentY = (gesture.mid.y - gesture.view.y) / gesture.view.scale;
      apply({ scale, x: mid.x - contentX * scale, y: mid.y - contentY * scale });
      return;
    }
    if (pointers.current.size === 1) {
      const current = viewRef.current;
      apply({ ...current, x: current.x + point.x - previous.x, y: current.y + point.y - previous.y });
    }
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    const point = pointers.current.get(e.pointerId) ?? local(e);
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 1) {
      // Один палец из двух подняли — дальше второй двигает картинку, а не продолжает щипок.
      pinch.current = null;
      return;
    }
    if (pointers.current.size > 0) return;
    pinch.current = null;
    if (moved.current || e.type === "pointercancel") {
      tap.current = null;
      return;
    }
    const now = performance.now();
    const last = tap.current;
    if (last && now - last.time < DOUBLE_TAP_MS && Math.hypot(point.x - last.x, point.y - last.y) < TAP_SLOP * 3) {
      tap.current = null;
      const current = viewRef.current;
      if (current.scale > 1) reset();
      else apply(zoomAt(current, DOUBLE_TAP_SCALE, point.x, point.y));
    } else {
      tap.current = { time: now, x: point.x, y: point.y };
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLDialogElement>) {
    const current = viewRef.current;
    const keys: Record<string, () => void> = {
      "+": () => zoomBy(STEP),
      "=": () => zoomBy(STEP),
      "-": () => zoomBy(1 / STEP),
      "0": reset,
      ArrowLeft: () => apply({ ...current, x: current.x + PAN_STEP }),
      ArrowRight: () => apply({ ...current, x: current.x - PAN_STEP }),
      ArrowUp: () => apply({ ...current, y: current.y + PAN_STEP }),
      ArrowDown: () => apply({ ...current, y: current.y - PAN_STEP }),
    };
    const action = keys[e.key];
    if (!action) return;
    e.preventDefault();
    action();
  }

  // В конец страницы, а не рядом с картинкой: картинка в тексте стоит внутри абзаца, а <dialog> внутри <p> — ошибка
  // разметки (React ругается в консоли, браузер может разорвать абзац).
  return createPortal(
    <dialog
      ref={dialogRef}
      className={styles.viewer}
      aria-label={alt ? `Картинка: ${alt}` : "Картинка"}
      // Esc закрывает так же, как кнопка: через историю, чтобы в ней не осталось лишней записи.
      onCancel={(e) => {
        e.preventDefault();
        requestClose();
      }}
      // Chrome иногда закрывает диалог по Esc, даже если отменить событие: тогда тоже убираем свою запись истории.
      onClose={() => {
        if (open) requestClose();
      }}
      onKeyDown={onKeyDown}
    >
      {open && (
        <>
          <div
            ref={stageRef}
            className={styles.stage}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <img
              className={styles.image}
              src={src}
              alt={alt}
              crossOrigin={crossOrigin}
              referrerPolicy="no-referrer"
              draggable={false}
              onLoad={(e) => setNatural({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })}
              style={{
                width: fit.width || undefined,
                height: fit.height || undefined,
                visibility: fit.width ? "visible" : "hidden",
                transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
              }}
            />
          </div>
          <div className={styles.toolbar}>
            <IconButton icon="minus" label="Уменьшить" onClick={() => zoomBy(1 / STEP)} disabled={view.scale <= 1} />
            <span className={styles.zoom} aria-live="polite">
              {Math.round(view.scale * 100)}%
            </span>
            <IconButton icon="plus" label="Увеличить" onClick={() => zoomBy(STEP)} disabled={view.scale >= MAX_SCALE} />
            <IconButton icon="fit" label="Вписать в экран" onClick={reset} disabled={view.scale <= 1} />
            <IconButton icon="close" label="Закрыть" onClick={requestClose} />
          </div>
          {caption && <p className={styles.caption}>{caption}</p>}
        </>
      )}
    </dialog>,
    document.body,
  );
}
