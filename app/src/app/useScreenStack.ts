import { useEffect, useRef, useState } from "react";

export type AppScreen =
  | { name: "home" }
  | { name: "session" }
  | { name: "summary" }
  | { name: "notes" }
  | { name: "sets" }
  | { name: "setHome"; setId: string }
  | { name: "review"; setId: string; questionId: string };

interface HistoryState {
  depth: number;
}

/**
 * Стек экранов, связанный с историей браузера: каждый push добавляет запись в историю,
 * поэтому системная кнопка «Назад» на Android возвращает на предыдущий экран, а не закрывает приложение.
 * Адрес страницы при этом не меняется — экраны не открываются по прямой ссылке, и это не нужно.
 */
export function useScreenStack(initial: AppScreen, onPop: (popped: AppScreen[]) => void) {
  const [stack, setStack] = useState<AppScreen[]>([initial]);
  // Ссылка — источник правды для обработчика popstate, состояние — для отрисовки.
  const stackRef = useRef(stack);
  const onPopRef = useRef(onPop);

  useEffect(() => {
    onPopRef.current = onPop;
  });

  function commit(next: AppScreen[]) {
    stackRef.current = next;
    setStack(next);
  }

  useEffect(() => {
    history.replaceState({ depth: stackRef.current.length } satisfies HistoryState, "");

    function onPopState(e: PopStateEvent) {
      const depth = Math.max(1, (e.state as HistoryState | null)?.depth ?? 1);
      const current = stackRef.current;
      // Переход «вперёд» по истории не поддерживаем: экран, с которого ушли, уже не восстановить.
      if (depth >= current.length) return;
      commit(current.slice(0, depth));
      onPopRef.current(current.slice(depth));
    }

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function push(screen: AppScreen) {
    const next = [...stackRef.current, screen];
    history.pushState({ depth: next.length } satisfies HistoryState, "");
    commit(next);
  }

  /** Подменить текущий экран, не добавляя записи в историю. */
  function replace(screen: AppScreen) {
    commit([...stackRef.current.slice(0, -1), screen]);
  }

  function back() {
    if (stackRef.current.length > 1) history.back();
  }

  function backToRoot() {
    const steps = stackRef.current.length - 1;
    if (steps > 0) history.go(-steps);
  }

  return { screen: stack[stack.length - 1], push, replace, back, backToRoot };
}
