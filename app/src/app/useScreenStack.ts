import { useEffect, useRef, useState } from "react";

export type AppScreen =
  | { name: "home" }
  | { name: "session" }
  | { name: "summary" }
  | { name: "notes" }
  | { name: "sets" }
  | { name: "speechHome" }
  | { name: "setHome"; setId: string }
  | { name: "help" }
  | { name: "helpSets" }
  | { name: "review"; setId: string; questionId: string };

interface HistoryState {
  depth: number;
}

/**
 * Стек экранов, связанный с историей браузера: каждый push добавляет запись в историю,
 * поэтому системная кнопка «Назад» на Android возвращает на предыдущий экран, а не закрывает приложение.
 * Адрес страницы при этом не меняется — экраны не открываются по прямой ссылке, и это не нужно.
 */
export function useScreenStack<S>(initialStack: S[], onPop: (popped: S[]) => void) {
  const [stack, setStack] = useState<S[]>(initialStack);
  // Ссылка — источник правды для обработчика popstate, состояние — для отрисовки.
  const stackRef = useRef(stack);
  const onPopRef = useRef(onPop);
  // В режиме разработки StrictMode запускает эффект дважды — записи истории создаём один раз.
  const historyReady = useRef(false);

  useEffect(() => {
    onPopRef.current = onPop;
  });

  function commit(next: S[]) {
    stackRef.current = next;
    setStack(next);
  }

  useEffect(() => {
    if (!historyReady.current) {
      historyReady.current = true;
      // По записи истории на каждый экран начального стека; метку #help из адреса убираем,
      // чтобы перезагрузка страницы не открывала инструкцию снова.
      const url = location.pathname + location.search;
      history.replaceState({ depth: 1 } satisfies HistoryState, "", url);
      for (let depth = 2; depth <= stackRef.current.length; depth++) {
        history.pushState({ depth } satisfies HistoryState, "", url);
      }
    }

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

  function push(screen: S) {
    const next = [...stackRef.current, screen];
    history.pushState({ depth: next.length } satisfies HistoryState, "");
    commit(next);
  }

  /** Подменить текущий экран, не добавляя записи в историю. */
  function replace(screen: S) {
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
