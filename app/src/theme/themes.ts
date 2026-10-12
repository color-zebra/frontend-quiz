import { readStorage, writeStorage } from "../shared/lib/storage";

export type ThemeId = "aurora" | "graphite" | "terminal" | "sunset";

export interface ThemeInfo {
  id: ThemeId;
  name: string;
  description: string;
  /** Цвет строки состояния Android. Должен совпадать со скриптом в index.html. */
  statusBarColor: string;
}

export const THEMES: readonly ThemeInfo[] = [
  {
    id: "aurora",
    name: "Аврора",
    description: "Фиолетово-бирюзовое сияние, сильное размытие",
    statusBarColor: "#0b0920",
  },
  {
    id: "graphite",
    name: "Графит",
    description: "Матовое стекло почти без цвета",
    statusBarColor: "#17181c",
  },
  {
    id: "terminal",
    name: "Терминал",
    description: "Чёрный фон и изумрудное свечение",
    statusBarColor: "#040607",
  },
  {
    id: "sunset",
    name: "Закат",
    description: "Тёплое сияние, крупные скругления",
    statusBarColor: "#140a1f",
  },
];

export const DEFAULT_THEME: ThemeId = "aurora";

const STORAGE_KEY = "fq.theme";

function getThemeInfo(id: string | null) {
  return THEMES.find((t) => t.id === id);
}

export function readSavedTheme(): ThemeId {
  return getThemeInfo(readStorage(STORAGE_KEY))?.id ?? DEFAULT_THEME;
}

export function applyTheme(id: ThemeId) {
  const info = getThemeInfo(id);
  if (!info) return;
  document.documentElement.dataset.theme = id;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", info.statusBarColor);
  writeStorage(STORAGE_KEY, id);
}
