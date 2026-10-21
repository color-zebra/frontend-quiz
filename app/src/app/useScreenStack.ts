import { useEffect, useRef, useState } from "react";
import type { TrainingKind } from "../features/session/filters";

export type AppScreen =
  | { name: "home" }
  | { name: "session" }
  | { name: "summary" }
  | { name: "notes" }
  | { name: "stats" }
  | { name: "cabinet" }
  | { name: "achievements" }
  | { name: "sets" }
  | { name: "speechHome" }
  | { name: "setHome"; setId: string }
  | { name: "training"; setId: string; kind: TrainingKind }
  | { name: "help" }
  | { name: "helpBasics" }
  | { name: "helpSets" }
  | { name: "review"; setId: string; questionId: string }
  // Режим обучения: оглавление курса (finished — пришли с последнего урока), урок и вопросы урока.
  | { name: "course"; setId: string; finished?: boolean }
  | { name: "lesson"; setId: string; lessonId: string }
  | { name: "lessonQuiz"; setId: string; lessonId: string };

interface HistoryState {
  depth: number;
}

/**
 * Экран, подменённый после отката истории (rewind), открывается с начала. Иначе браузер вернул бы прокрутку
 * записи, на которую откатились: из вопросов урока «Следующий урок» открывался бы в самом низу — там, где
 * в прошлом уроке нажали «К вопросам». Восстановление выключаем только на этот переход: обычная «Назад»
 * по-прежнему возвращает туда, где человек остановился.
 */
function keepScrollAtTop() {
  history.scrollRestoration = "manual";
  requestAnimationFrame(() => {
    window.scrollTo(0, 0);
    history.scrollRestoration = "auto";
  });
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
  // Экран, который встанет на место верхнего, когда история вернётся назад (см. rewind).
  const pendingReplace = useRef<S | null>(null);

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
      const replacement = pendingReplace.current;
      pendingReplace.current = null;
      if (replacement) keepScrollAtTop();
      commit(replacement ? [...current.slice(0, depth - 1), replacement] : current.slice(0, depth));
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

  /**
   * Вернуться на steps экранов назад и подменить тот, что окажется сверху. Так из вопросов урока переходят
   * к следующему уроку: системная «Назад» потом ведёт к набору, а не листает все пройденные уроки по одному.
   */
  function rewind(steps: number, screen: S) {
    // Двойное нажатие, пока история ещё возвращается, ушло бы на лишний шаг назад.
    if (pendingReplace.current) return;
    const target = Math.min(steps, stackRef.current.length - 1);
    if (target <= 0) {
      replace(screen);
      return;
    }
    pendingReplace.current = screen;
    history.go(-target);
    // Подстраховка: если браузер так и не сообщит о переходе назад, кнопки не должны залипнуть до перезагрузки.
    setTimeout(() => {
      if (pendingReplace.current === screen) pendingReplace.current = null;
    }, 1000);
  }

  function back() {
    if (stackRef.current.length > 1) history.back();
  }

  function backToRoot() {
    const steps = stackRef.current.length - 1;
    if (steps > 0) history.go(-steps);
  }

  return { screen: stack[stack.length - 1], getStack: () => stackRef.current, push, replace, rewind, back, backToRoot };
}
