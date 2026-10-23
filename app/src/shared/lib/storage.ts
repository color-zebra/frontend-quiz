// localStorage может быть недоступен (приватный режим, запрет сайта) — тогда тихо работаем без него.

export function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Настройка просто не запомнится.
  }
}

export function readStorageJson(key: string): unknown {
  const raw = readStorage(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function removeStorage(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Нечего удалять или нельзя — не страшно.
  }
}

// sessionStorage — то, что живёт до закрытия вкладки: раскрытый раздел списка и т. п.

export function readSessionStorage(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeSessionStorage(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Просто не запомнится.
  }
}
