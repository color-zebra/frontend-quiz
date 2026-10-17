import items from "virtual:sets-catalog";
import { toRawUrl } from "./setUrl";
import type { SetRecord } from "./setsStore";

/** Пункт каталога, как его собрала сборка из custom-sets/catalog.yaml и самого набора. */
export type CatalogItem = (typeof items)[number];

export interface CatalogEntry extends CatalogItem {
  /** Сырой файл по ссылке. Нет, если ссылка не подходит: тогда «Добавить» покажет, что с ней не так. */
  rawUrl: string | undefined;
}

function tryRawUrl(link: string) {
  try {
    return toRawUrl(link);
  } catch {
    return undefined;
  }
}

/** Готовые наборы в порядке каталога. */
export const CATALOG: readonly CatalogEntry[] = items.map((item) => ({ ...item, rawUrl: tryRawUrl(item.url) }));

/** Сырой файл GitHub без «refs/heads/»: кнопка Raw даёт такой адрес, а файл по нему тот же. */
function normalizeRawUrl(url: string) {
  return url.replace(/^(https:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+)\/refs\/heads\//, "$1/");
}

/** Набор из каталога, который уже есть на устройстве: добавлен из каталога или вручную по ссылке на тот же файл. */
export function findAddedSet(entry: CatalogEntry, sets: readonly SetRecord[]) {
  if (!entry.rawUrl) return undefined;
  const rawUrl = normalizeRawUrl(entry.rawUrl);
  return sets.find((record) => record.url && normalizeRawUrl(record.url) === rawUrl);
}
