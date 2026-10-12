import { useState } from "react";
import { formatDiff } from "../../data/formatDiff";
import type { QuestionBank } from "../../data/types";
import type { SessionLength } from "../../features/session/filters";
import { useSets } from "../../features/sets/SetsProvider";
import { formatShortDate } from "../../shared/lib/formatDate";
import { countQuestions } from "../../shared/lib/plural";
import { IconButton } from "../../shared/ui/Button";
import { Notice } from "../../shared/ui/Notice";
import { Screen, TopBar } from "../../shared/ui/Screen";
import { ScreenTitle } from "../../shared/ui/ScreenTitle";
import { TrainingFilters } from "../training/TrainingFilters";
import styles from "./SetHomeScreen.module.css";

interface SetHomeScreenProps {
  setId: string;
  onBack: () => void;
  onStart: (bank: QuestionBank, questionIds: string[], length: SessionLength) => void;
}

type Message = { kind: "ok" | "error"; text: string };

/** Тренировка по своему набору: то же, что главная, но только вопросы набора. */
export function SetHomeScreen({ setId, onBack, onStart }: SetHomeScreenProps) {
  const { sets, getSetBank, updateSet } = useSets();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const record = sets.find((s) => s.id === setId);
  const bank = getSetBank(setId);
  // Набор целиком либо тестовый, либо устный (kind: speech).
  const isSpeechSet = !!bank && bank.speech.length > 0 && bank.questions.length === 0;

  async function refresh() {
    setBusy(true);
    setMessage(null);
    try {
      const { diff } = await updateSet(setId);
      setMessage({ kind: "ok", text: formatDiff(diff, "Набор обновлён", "Набор не изменился.") });
    } catch (error) {
      setMessage({ kind: "error", text: `Не удалось обновить: ${error instanceof Error ? error.message : "неизвестная ошибка"}` });
    } finally {
      setBusy(false);
    }
  }

  if (!record || !bank) {
    return (
      <Screen>
        <TopBar>
          <IconButton icon="arrowLeft" label="Назад" onClick={onBack} />
        </TopBar>
        <p className={styles.missing}>Этого набора больше нет на устройстве.</p>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar>
        <IconButton icon="arrowLeft" label="Назад" onClick={onBack} />
        {/* Набор из файла обновляется повторной загрузкой файла на экране «Мои наборы». */}
        {record.url && <IconButton icon="refresh" label="Обновить набор" busy={busy} onClick={refresh} />}
      </TopBar>

      <ScreenTitle
        title={record.title}
        subtitle={`${isSpeechSet ? "Устные вопросы" : "Тест"} · ${countQuestions(isSpeechSet ? bank.speech.length : bank.questions.length)} · обновлён ${formatShortDate(record.updatedAt)}`}
      />

      {message && <Notice kind={message.kind} text={message.text} onClose={() => setMessage(null)} />}

      {/* key: после обновления набора фильтры перечитываются под новые темы */}
      <TrainingFilters key={record.updatedAt} bank={bank} kind={isSpeechSet ? "speech" : "test"}
        onStart={(ids, length) => onStart(bank, ids, length)} />
    </Screen>
  );
}
