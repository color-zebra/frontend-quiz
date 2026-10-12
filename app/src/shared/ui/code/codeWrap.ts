import { useSyncExternalStore } from "react";
import { readStorage, writeStorage } from "../../lib/storage";

// Перенос строк в блоках кода: одна настройка на всё приложение, запоминается на устройстве.
const STORAGE_KEY = "fq.codeWrap";
let wrap = readStorage(STORAGE_KEY) === "1";
const listeners = new Set<() => void>();

export function toggleCodeWrap() {
  wrap = !wrap;
  writeStorage(STORAGE_KEY, wrap ? "1" : "0");
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useCodeWrap() {
  return useSyncExternalStore(subscribe, () => wrap);
}
