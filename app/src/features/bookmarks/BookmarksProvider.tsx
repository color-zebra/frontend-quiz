import { createStore, del, delMany, entries, set } from "idb-keyval";
import { createContext, use, useEffect, useState, type ReactNode } from "react";

/** Закладка «Вернуться позже»: вопрос, к которому человек сам решил вернуться. Снимается только вручную. */
export interface Bookmark {
  setId: string;
  questionId: string;
  /** Когда поставлена, мс с 1970 года. */
  at: number;
}

// Отдельная база IndexedDB под закладки. Ключ записи — getBookmarkKey.
const store = createStore("frontend-quiz-bookmarks", "bookmarks");

export const getBookmarkKey = (setId: string, questionId: string) => `${setId}:${questionId}`;

export function isBookmark(value: unknown): value is Bookmark {
  const b = value as Bookmark | null;
  return !!b && typeof b.setId === "string" && typeof b.questionId === "string" && typeof b.at === "number";
}

interface BookmarksContextValue {
  bookmarks: ReadonlyMap<string, Bookmark>;
  isBookmarked: (setId: string, questionId: string) => boolean;
  toggle: (setId: string, questionId: string) => void;
  /** Закладки базы или набора — от новых к старым. */
  getBookmarks: (setId: string) => Bookmark[];
  /** Снять все закладки базы или набора. */
  clear: (setId: string) => void;
  /** Закладки из резервной копии: добавляются те, которых ещё нет. Возвращает, сколько добавлено. */
  importBookmarks: (incoming: readonly Bookmark[]) => number;
}

const BookmarksContext = createContext<BookmarksContextValue | null>(null);

export function BookmarksProvider({ children }: { children: ReactNode }) {
  const [bookmarks, setBookmarks] = useState<Map<string, Bookmark>>(new Map());

  useEffect(() => {
    entries<string, unknown>(store).then(
      (all) => {
        const saved = all.flatMap(([key, value]) => (isBookmark(value) ? [[key, value] as const] : []));
        // Закладки, поставленные до окончания чтения, свежее прочитанных.
        setBookmarks((prev) => new Map([...saved, ...prev]));
      },
      // IndexedDB недоступна — закладки живут до закрытия вкладки.
      () => undefined,
    );
  }, []);

  function update(change: (next: Map<string, Bookmark>) => void) {
    setBookmarks((prev) => {
      const next = new Map(prev);
      change(next);
      return next;
    });
  }

  function toggle(setId: string, questionId: string) {
    const key = getBookmarkKey(setId, questionId);
    if (bookmarks.has(key)) {
      update((next) => next.delete(key));
      del(key, store).catch(() => undefined);
      return;
    }
    const bookmark = { setId, questionId, at: Date.now() };
    update((next) => next.set(key, bookmark));
    set(key, bookmark, store).catch(() => undefined);
  }

  function getBookmarks(setId: string) {
    return [...bookmarks.values()].filter((b) => b.setId === setId).sort((a, b) => b.at - a.at);
  }

  function clear(setId: string) {
    const keys = getBookmarks(setId).map((b) => getBookmarkKey(b.setId, b.questionId));
    update((next) => keys.forEach((key) => next.delete(key)));
    delMany(keys, store).catch(() => undefined);
  }

  function importBookmarks(incoming: readonly Bookmark[]) {
    const fresh = incoming.filter((b) => !bookmarks.has(getBookmarkKey(b.setId, b.questionId)));
    update((next) => fresh.forEach((b) => next.set(getBookmarkKey(b.setId, b.questionId), b)));
    for (const b of fresh) set(getBookmarkKey(b.setId, b.questionId), b, store).catch(() => undefined);
    return fresh.length;
  }

  const value = {
    bookmarks,
    isBookmarked: (setId: string, questionId: string) => bookmarks.has(getBookmarkKey(setId, questionId)),
    toggle,
    getBookmarks,
    clear,
    importBookmarks,
  };
  return <BookmarksContext value={value}>{children}</BookmarksContext>;
}

export function useBookmarks() {
  const value = use(BookmarksContext);
  if (!value) throw new Error("useBookmarks вызван вне BookmarksProvider");
  return value;
}
