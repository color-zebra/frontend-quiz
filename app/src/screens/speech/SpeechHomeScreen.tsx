import type { QuestionBank } from "../../data/types";
import type { SessionLength } from "../../features/session/filters";
import { countQuestions } from "../../shared/lib/plural";
import { IconButton } from "../../shared/ui/Button";
import { Screen, TopBar } from "../../shared/ui/Screen";
import { ScreenTitle } from "../../shared/ui/ScreenTitle";
import { TrainingFilters } from "../training/TrainingFilters";
import styles from "./SpeechHomeScreen.module.css";

interface SpeechHomeScreenProps {
  bank: QuestionBank;
  onBack: () => void;
  onStart: (questionIds: string[], length: SessionLength) => void;
}

/** Раздел устных вопросов основной базы: свои фильтры, своя сессия с самооценкой. */
export function SpeechHomeScreen({ bank, onBack, onStart }: SpeechHomeScreenProps) {
  return (
    <Screen>
      <TopBar>
        <IconButton icon="arrowLeft" label="Назад" onClick={onBack} />
      </TopBar>
      <ScreenTitle title="Устные вопросы" subtitle={countQuestions(bank.speech.length)} />
      <p className={styles.intro}>
        Вариантов ответа нет, как на настоящем собеседовании. Ответь про себя или вслух, открой эталон и честно
        оцени себя: знал, частично или не знал. «Частично» и «не знал» попадут в «Повторить слабые».
      </p>
      <TrainingFilters key={bank.generatedAt} bank={bank} kind="speech" onStart={onStart} />
    </Screen>
  );
}
