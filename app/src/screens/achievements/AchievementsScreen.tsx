import clsx from "clsx";
import { useState } from "react";
import type { QuestionBank } from "../../data/types";
import { AchievementBadge } from "../../features/achievements/AchievementBadge";
import { ACHIEVEMENT_DETAILS, GROUP_TITLES, type AchievementGroup } from "../../features/achievements/achievements";
import { getAchievements, type AchievementState } from "../../features/achievements/compute";
import { useProgress } from "../../features/progress/ProgressProvider";
import { IconButton } from "../../shared/ui/Button";
import { SectionLabel } from "../../shared/ui/Card";
import glass from "../../shared/ui/glass.module.css";
import { Screen, TopBar } from "../../shared/ui/Screen";
import { ScreenTitle } from "../../shared/ui/ScreenTitle";
import { Sheet } from "../../shared/ui/Sheet";
import styles from "./AchievementsScreen.module.css";

interface AchievementsScreenProps {
  bank: QuestionBank;
  onBack: () => void;
}

const dateFormat = new Intl.DateTimeFormat("ru", { day: "numeric", month: "long" });

/** Все ачивки столбцом карточек по группам; по нажатию — шторка с картинкой и описанием. */
export function AchievementsScreen({ bank, onBack }: AchievementsScreenProps) {
  const { records } = useProgress();
  const [openId, setOpenId] = useState<string | null>(null);
  const states = getAchievements(bank, records);
  const earned = states.filter((s) => s.earnedAt).length;
  const groups = Object.keys(GROUP_TITLES) as AchievementGroup[];
  const open = states.find((s) => s.achievement.id === openId);

  return (
    <Screen>
      <TopBar>
        <IconButton icon="arrowLeft" label="Назад" onClick={onBack} />
      </TopBar>
      <ScreenTitle title="Достижения" subtitle={`Получено ${earned} из ${states.length} · по основной базе`} />

      {groups.map((group) => (
        <section key={group} className={styles.group}>
          <SectionLabel>{GROUP_TITLES[group]}</SectionLabel>
          {states
            .filter((s) => s.achievement.group === group)
            .map((state) => (
              <AchievementCard key={state.achievement.id} state={state} onOpen={() => setOpenId(state.achievement.id)} />
            ))}
        </section>
      ))}

      <Sheet open={!!open} title={open?.achievement.title ?? ""} onClose={() => setOpenId(null)}>
        {open && <AchievementDetails state={open} />}
      </Sheet>
    </Screen>
  );
}

/** Подпись под полоской: «X из Y», у полученной — дата. */
function getStatus({ earnedAt, progressLabel }: AchievementState) {
  return earnedAt ? `получено ${dateFormat.format(earnedAt)}` : progressLabel;
}

function AchievementCard({ state, onOpen }: { state: AchievementState; onOpen: () => void }) {
  const { achievement, earnedAt } = state;
  return (
    <button type="button" className={clsx(styles.card, glass.glass, !earnedAt && styles.locked)} onClick={onOpen}>
      <AchievementBadge achievement={achievement} earned={!!earnedAt} />
      <span className={styles.body}>
        <span className={styles.title}>{achievement.title}</span>
        <ProgressBar state={state} />
        <span className={clsx(styles.status, earnedAt && styles.earned)}>{getStatus(state)}</span>
      </span>
    </button>
  );
}

function ProgressBar({ state }: { state: AchievementState }) {
  return (
    <span className={clsx(styles.bar, state.earnedAt && styles.barDone)}>
      <span style={{ width: `${(state.earnedAt ? 1 : state.progress) * 100}%` }} />
    </span>
  );
}

/** Шторка: крупный медальон, за что дают и где ты сейчас. */
function AchievementDetails({ state }: { state: AchievementState }) {
  const { achievement, earnedAt } = state;
  return (
    <div className={styles.details}>
      <AchievementBadge achievement={achievement} earned={!!earnedAt} size={112} />
      <p className={styles.description}>{ACHIEVEMENT_DETAILS[achievement.id] ?? achievement.description}</p>
      <div className={styles.detailsProgress}>
        <ProgressBar state={state} />
        <span className={clsx(styles.status, earnedAt && styles.earned)}>{getStatus(state)}</span>
      </div>
    </div>
  );
}
