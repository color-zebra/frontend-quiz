import { useSyncExternalStore } from "react";

// Событие Chrome, которое разрешает показать окно установки из своей кнопки. В стандартных типах DOM его нет.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

/**
 * Ловит предложение установки. Браузер присылает его один раз и может сделать это раньше,
 * чем отрисуется React, поэтому слушатель вешается при старте, до рендера.
 */
export function listenForInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (e) => {
    // Без preventDefault Chrome показал бы свою плашку внизу; у нас своя кнопка на главной.
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** true, когда браузер готов установить приложение и оно ещё не установлено. */
export function useCanInstall() {
  return useSyncExternalStore(subscribe, () => deferredPrompt !== null);
}

export async function promptInstall() {
  const prompt = deferredPrompt;
  if (!prompt) return;
  // Окно установки можно показать только один раз за событие.
  deferredPrompt = null;
  notify();
  await prompt.prompt();
}
