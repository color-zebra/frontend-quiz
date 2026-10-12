import { createContext, use, useEffect, useState, type ReactNode } from "react";
import { createBank, getBankDiff, type BankDiff } from "../../data/loadQuestions";
import type { QuestionBank } from "../../data/types";
import { toRawGithubUrl } from "./githubUrl";
import { fetchSet } from "./loadSet";
import { deleteSetRecord, getSetId, readAllSets, writeSet, type SetRecord } from "./setsStore";

export interface AddResult {
  record: SetRecord;
  skipped: number;
}

export interface UpdateResult {
  diff: BankDiff;
  skipped: number;
}

interface SetsContextValue {
  /** Наборы в порядке добавления. */
  sets: SetRecord[];
  /** false — IndexedDB недоступна, наборы живут до закрытия вкладки. */
  persistent: boolean;
  getSetBank: (id: string) => QuestionBank | undefined;
  addSet: (link: string) => Promise<AddResult>;
  updateSet: (id: string) => Promise<UpdateResult>;
  removeSet: (id: string) => void;
}

const SetsContext = createContext<SetsContextValue | null>(null);

// База набора строится из записи один раз; новая запись (после обновления) — новая база.
const bankCache = new WeakMap<SetRecord, QuestionBank>();

export function SetsProvider({ children }: { children: ReactNode }) {
  const [sets, setSets] = useState<SetRecord[]>([]);
  const [persistent, setPersistent] = useState(true);

  useEffect(() => {
    readAllSets()
      .then((list) => setSets((prev) => mergeSets(list, prev)))
      .catch(() => setPersistent(false));
  }, []);

  function persist(operation: Promise<unknown>) {
    operation.catch(() => setPersistent(false));
  }

  function put(record: SetRecord) {
    setSets((prev) => mergeSets(prev, [record]));
    persist(writeSet(record));
  }

  function getSetBank(id: string) {
    const record = sets.find((s) => s.id === id);
    if (!record) return undefined;
    let bank = bankCache.get(record);
    if (!bank) {
      bank = createBank(record.file, record.id);
      bankCache.set(record, bank);
    }
    return bank;
  }

  async function addSet(link: string): Promise<AddResult> {
    const url = toRawGithubUrl(link);
    const id = getSetId(url);
    const existing = sets.find((s) => s.id === id);
    if (existing) throw new Error(`Этот набор уже добавлен: «${existing.title}»`);

    const { file, skipped } = await fetchSet(url);
    const now = Date.now();
    const record: SetRecord = { id, url, title: file.title ?? "Набор вопросов", addedAt: now, updatedAt: now, skipped, file };
    put(record);
    return { record, skipped };
  }

  async function updateSet(id: string): Promise<UpdateResult> {
    const current = sets.find((s) => s.id === id);
    if (!current) throw new Error("Набор не найден");
    const { file, skipped } = await fetchSet(current.url);
    put({ ...current, title: file.title ?? current.title, updatedAt: Date.now(), skipped, file });
    return { diff: getBankDiff(current.file, file), skipped };
  }

  function removeSet(id: string) {
    setSets((prev) => prev.filter((s) => s.id !== id));
    persist(deleteSetRecord(id));
  }

  return (
    <SetsContext value={{ sets, persistent, getSetBank, addSet, updateSet, removeSet }}>{children}</SetsContext>
  );
}

/** Объединяет списки по id (записи из second побеждают) и сортирует по времени добавления. */
function mergeSets(first: readonly SetRecord[], second: readonly SetRecord[]) {
  const byId = new Map(first.map((s) => [s.id, s]));
  for (const record of second) byId.set(record.id, record);
  return [...byId.values()].sort((a, b) => a.addedAt - b.addedAt);
}

export function useSets() {
  const value = use(SetsContext);
  if (!value) throw new Error("useSets вызван вне SetsProvider");
  return value;
}
